'use strict';

import React, { Component } from 'react';

import {
	StyleSheet,
	Text,
	View,
	Image,
	AsyncStorage,
	TouchableHighlight,
	AlertIOS,
} from 'react-native';

const FBSDK = require('react-native-fbsdk');

const {
	LoginButton,
	GraphRequest,
	GraphRequestManager,
	LoginManager,
	AccessToken,
} = FBSDK;

/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Main Screen
------------------------------------------------------------------------------------------------------------------------------------------------------ */

class LoginPage extends Component {

	render() {
		return (

			<View style={{flex: 1,}}>

				<View style={styles.container}>

					<Image style= {styles.loginlogo} source={require('../crowd-login.png')} />

					<LoginButton
						style={styles.button}
						readPermissions={["public_profile", "email", "user_friends"]}
						onLoginFinished={
							(error, result) => {
								if (error) {
									alert("login has error: " + result.error);
								} 
								else if (result.isCancelled) {
								} 
								else {
							    	AccessToken.getCurrentAccessToken().then((response) => {
								        this._createUser(response);
								    }).done();

								}
							}
						}
					/>

				</View>

			</View>

		);
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Create User Request
	------------------------------------------------------------------------------------------------------------------------------------------------------ */

	_createUser(response) {
		fetch("http://localhost:3000/users", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				facebook_auth_token: response.accessToken,
				facebook_id: response.userID
			})
		})
		.then((response) => {
			return response.json()
		})
		.then((responseData) => {
			return responseData;
		})
		.then((data) => { 
			var access_token = JSON.stringify(data.access_token)
			var facebook_picture = (data.facebook_picture)
			var user_name = (data.name)
			var user_id = JSON.stringify(data.id)
			AsyncStorage.setItem("access_token", access_token)
			AsyncStorage.setItem("facebook_picture", facebook_picture)
			AsyncStorage.setItem("user_name", user_name)
			AsyncStorage.setItem("user_id", user_id)

		})
		.catch(function(err) {
			console.log(err);
	  	})
		.done();

		this._loadMapPage();

	}

	_loadMapPage() {
		this.props.navigator.resetTo({
			screen: "Crowd.MapPage",
		    navigatorStyle: {
		    	navBarTextColor: '#fff',
			  	navBarBackgroundColor: '#074E64',
			  	navBarButtonColor: '#fff',
		      	statusBarTextColorScheme: 'light'
		    },
			titleImage: require('./../logo.png'), //navigation bar title image instead of the title text of the pushed screen (optional)
		    navigatorButtons: {
	    		rightButtons: [{
			        title: 'Inbox', // for a textual button, provide the button title (label)
			        id: 'inbox', // id for this button, given in onNavigatorEvent(event) to help understand which button was clicked			        showAsAction: 'ifRoom' // optional, Android only. Control how the button is displayed in the Toolbar. Accepted valued: 'ifRoom' (default) - Show this item as a button in an Action Bar if the system decides there is room for it. 'always' - Always show this item as a button in an Action Bar. 'withText' - When this item is in the action bar, always show it with a text label even if it also has an icon specified. 'never' - Never show this item as a button in an Action Bar.
		      	}],
		    },
		});
	};

}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Styles
------------------------------------------------------------------------------------------------------------------------------------------------------ */

const styles = StyleSheet.create({

	container: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#074E64',
	},

	loginlogo: {
		marginTop:130,
	},

	button: {
		position: 'absolute',
		padding: 25,
		margin: 40,
		bottom: 160,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.45,
		width: 300,
	},

  	buttonText: {
		fontSize: 18,
		color: 'white',
		alignSelf: 'center'
	},

});

module.exports = LoginPage;
