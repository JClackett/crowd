## Crowd App

Make sure you have:

* Node
* Npm
* React
* React-native

Run in project directory
```sh
npm install
```

# To run on simulator:

* Make sure the api is running
* All links in the app point to localhost:3000
* In AppDelegate.m - include this line
    -    jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
* `npm start` in project directory
* `react-native run-ios` in project directory

# To run on iphone/device

* Make sure you are on the same wifi as api server
* Server is running on 'rails server -b 0.0.0.0'
* In AppDelegate.m - include this line
    - jsCodeLocation = [NSURL URLWithString:@'http://<API-IP-ADDRESS>:8081/index.ios.bundle'];
* All links in the app point to 'http://<API-IP-ADDRESS>:3000'
* `npm start` in project directory
* Open project in xcode and run on device