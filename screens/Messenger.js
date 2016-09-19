'use strict';

import React, { Component } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';

import {
	StyleSheet,
	AsyncStorage,
	Text,
	View,
	TextInput,
	TouchableOpacity,
	Image,
	Dimensions,
} from 'react-native';

const window = Dimensions.get('window');
var margin = (window.width)*0.1
var theWidth = (window.width)-margin*2


class Messenger extends React.Component {

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Initializers
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	
  	constructor(props) {
	    super(props);
	    this.state = {messages: []};
	    this.onSend = this.onSend.bind(this);
	}

  	componentDidMount() {
	  	this._loadInitialState().done();
  	}


  	async _loadInitialState() {
		try {
			var profile_picture = await AsyncStorage.getItem("facebook_picture").then((value) => {return value});
			var user_name = await AsyncStorage.getItem("user_name").then((value) => {return value});
			var user_id = await AsyncStorage.getItem("user_id").then((value) => {return value});


		} catch (error) {
			this._appendMessage('AsyncStorage error: ' + error.message);
		};

		this.setState({facebook_picture: profile_picture});
		this.setState({user_name: user_name});
		this.setState({user_id: user_id});

	    this.onMessengerLoad(this.props.event_id);

	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Get Messages
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	

  	onMessengerLoad(event_id) {
	  	var query = this._urlForMessageQuery(event_id);
	  	this.getMessages(query);
	}

	_urlForMessageQuery(event_id) {
		var id = event_id;
		return 'http://localhost:3000/events/' + id;
	}

	getMessages(query) {
		AsyncStorage.getItem("access_token").then((value) => {
			fetch(query,{
				method: "GET",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Token token=' + value
				},
			})
			.then((response) => {
				return response.json()
			})
			.then((responseData) => {
				return responseData;
			})
			.then((data) => { 
			 	var data = data
			 	if (data) {
			   		this.showMessages(data);
			 	}
			   	else {
			   		alert('nada')
			   	}
			})
			.catch(function(err) {
				console.log(err);
		  	})
			.done();
		}).done();
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Show messages
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	

	showMessages(messages) {

		this.setState({
			messages:
  				[messages]
		});

	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Send message
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  
  	onSend(messages = []) {
    	this.setState((previousState) => {
	      	return {
	        	messages: GiftedChat.append(previousState.messages, messages),
	      	};
		});
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Render
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	
  	render() {
	    return (
	      <GiftedChat
	        messages={this.state.messages}
	        onSend={this.onSend}
	        user={{
	          _id: 1,
	          name: this.state.user_name
	        }}
	      />
	    );
  	}
}



/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Styles
------------------------------------------------------------------------------------------------------------------------------------------------------ */

var styles = StyleSheet.create({

});

module.exports = Messenger;