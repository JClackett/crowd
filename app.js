import React, {Component} from 'react';
import {
  AppRegistry,
  View,
  AsyncStorage
} from 'react-native';

AppRegistry.registerComponent('Crowd', () => Crowd);

import {Navigation} from 'react-native-navigation';

const FBSDK = require('react-native-fbsdk');

const {
  AccessToken,
} = FBSDK;

// screen related book keeping
import {registerScreens} from './screens';
registerScreens();

AccessToken.getCurrentAccessToken().then((response) => {
	if (response != null) {
		Navigation.startSingleScreenApp({
		  screen: {
		    screen: "Crowd.MapPage",
		    navigatorStyle: {
		    	navBarTextColor: '#fff',
			  	navBarBackgroundColor: '#074E64',
			  	navBarButtonColor: '#fff',
		      	statusBarTextColorScheme: 'light'
		    },
			titleImage: require('./logo.png'), //navigation bar title image instead of the title text of the pushed screen (optional)
		    navigatorButtons: {
	    		rightButtons: [{
			        title: 'Inbox', // for a textual button, provide the button title (label)
			        id: 'inbox', // id for this button, given in onNavigatorEvent(event) to help understand which button was clicked			        showAsAction: 'ifRoom' // optional, Android only. Control how the button is displayed in the Toolbar. Accepted valued: 'ifRoom' (default) - Show this item as a button in an Action Bar if the system decides there is room for it. 'always' - Always show this item as a button in an Action Bar. 'withText' - When this item is in the action bar, always show it with a text label even if it also has an icon specified. 'never' - Never show this item as a button in an Action Bar.
		      	}],
		    },
		  }
		});
	}
	else {
		Navigation.startSingleScreenApp({
		  screen: {
		    screen: "Crowd.LoginPage",
		    navigatorStyle: {
		    	navBarHidden: true,
		      	statusBarTextColorScheme: 'light'
		    }
		  }
		});
	}
}).done();

