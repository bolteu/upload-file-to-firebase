# Upload test results to Firebase

## Set up

```bash
npm install
```

## Usage

In GitHub actions:

```
- name: Upload unit test results
    uses: bolteu/upload-file-to-firebase@v1.x
    if: failure()
    with:
        service-json: ${{ secrets.FIREBASE_STORAGE_JSON_KEY }}
        github-token: ${{secrets.GITHUB_TOKEN}}
        bucketName: "ios-ui-tests"
        bucketFolder: "client"
        directoryPath: "fastlane/test_output/test_result.xcresult"
        testNamePrefix: "Unit"
```

After any change you have to rebuild `dist/index.js` before commit:

```bash
npm run build
```