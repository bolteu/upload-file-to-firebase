const assert = require("assert");
const { inspect } = require("util");
const { command } = require("execa");
const core = require("@actions/core");
const { request } = require("@octokit/request");
const path = require("path");
const fs = require("fs");

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
      indexFile: core.getInput("indexFile"),
      directoryPath: core.getInput("directoryPath"),
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
      destinationLabel = `pr-numer-${context.issue.number}-${destinationLabel}`
    }
    const destinationFolder = `${inputs.bucketFolder}/${destinationLabel}`
    const bucket = admin.storage().bucket();

    const files = await fs.readdirSync(inputs.directoryPath);
    for (var i = files.length - 1; i >= 0; i--) {
      const file = files[i]
      const fileName = path.basename(file)
      const uploadedFile = await bucket.upload(file, { 
        destination: `destinationFolder/${fileName}`,
        predefinedAcl: "publicRead"
      })

      if (fileName == inputs.indexFile) {
        const id = uploadedFile[0]["id"]
        const url = `https://firebasestorage.googleapis.com/v0/b/${inputs.bucketName}/o/${id}?alt=media`
        const body = `UI tests run results - ${url}`
        await client.issues.createComment({...context.issue, body: body})
      }  
    }

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


