'use strict';

import React, { Component } from 'react';

import {
	StyleSheet,
	Text,
	View,
	Image,
	AsyncStorage,
	AlertIOS,
} from 'react-native';

import FBSDK from 'react-native-fbsdk';

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
		this.props.navigator.push({
			screen: "Crowd.MapPage",
			navigatorStyle: {
				navBarTextColor: '#fff',
				navBarBackgroundColor: '#074E64',
				navBarButtonColor: '#fff',
				statusBarTextColorScheme: 'light'
			},
			titleImage: require('./../logo.png'),
			    navigatorButtons: {
			      	leftButtons: [{
			      		title: 'Settings', 
				        id: 'settings', 
			      	}]
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
