const assert = require("assert");
const { inspect } = require("util");
const { command } = require("execa");
const core = require("@actions/core");
const { request } = require("@octokit/request");
const path = require("path");

const admin = require("firebase-admin");
import {context, GitHub} from '@actions/github'

main();

async function main() {
  try {
    const inputs = {
      serviceJson: core.getInput('service-json'),
      githubToken: core.getInput('github-token'),
      bucketName: core.getInput("bucketName"),
      bucketFolder: core.getInput("bucketFolder"),
      filePath: core.getInput("filePath"),
    };

    core.debug(`Inputs: ${inspect(inputs)}`);

    // Initialization
    const client = new GitHub(inputs.githubToken, { })

    const serviceAccount = JSON.parse(inputs.serviceJson);   
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: inputs.bucketName
    });

    var destinationLabel = `time-${Date.now().toString()}`
    if (context.issue != null && context.issue.number != null) {
      destinationLabel = `pr-numer-${context.issue.number}`
    }
    const destinationName = `${inputs.bucketFolder}/${destinationLabel}-${path.basename(inputs.filePath)}`
    const bucket = admin.storage().bucket();
    const uploadedFile = await bucket.upload(inputs.filePath, { destination: destinationName })
    
    const result = JSON.stringify(uploadedFile)
    const body = `UI run result - ${result}}`
    
    
    await client.issues.createComment({...context.issue, body: body})

  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

async function runShellCommand(commandString) {
  core.debug(`$ ${commandString}`);
  try {
    const { stdout, stderr } = await command(commandString, { shell: true });
    const output = [stdout, stderr].filter(Boolean).join("\n");
    core.debug(output);
    return output;
  } catch (error) {
    core.debug(inspect(error));
    throw error;
  }
}


