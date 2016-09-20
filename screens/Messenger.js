'use strict';

import React, { Component } from 'react';
import {GiftedChat, Actions, Bubble} from 'react-native-gifted-chat';

import {
	AsyncStorage,
	Text,
	View,
} from 'react-native';

import EStyleSheet from 'react-native-extended-stylesheet';
import theme from '../theme';

export default class Messenger extends React.Component {

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Initializers
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	
  	constructor(props) {

	    super(props);

	    this.state = {
	      	messages: [],
	    	event_id: this.props.event_id,
    	};

	    this.onSend = this.onSend.bind(this);
	}

  	componentDidMount() {
	  	this._loadInitialState().done();
  	}

  	componentWillMount() {
	    this.onMessengerLoad(this.props.event_id);
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
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Get Messages
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	

  	onMessengerLoad(event_id) {
  		console.log(this.props);
	  	var query = this._urlForMessageQuery(event_id);
	  	this.getMessages(query);
	}

	_urlForMessageQuery(event_id) {
		var params = {
	      	event_id: event_id,
	  	};
	 
		var querystring = Object.keys(params)
		.map(key => key + '=' + encodeURIComponent(params[key]))
		.join('&');

		return 'http://localhost:3000/messages?' + querystring;
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

		var arr = messages.reverse();

		for (var i = 0; i<arr.length; i++) {
			arr[i]._id = arr[i].id;
		    arr[i].text = arr[i].content;
		    arr[i].user = arr[i].creator;
		    arr[i].createdAt = arr[i].created_at;

		    arr[i].user._id = arr[i].user.id;
		    arr[i].user.avatar = arr[i].user.facebook_picture;

		    arr[i].position = 'right';

			delete arr[i].user.id;
			delete arr[i].user.created_at;
		    delete arr[i].user.facebook_picture;
		    delete arr[i].id;
		    delete arr[i].content;
		    delete arr[i].creator;
		}

		this.setState((previousState) => {
	      	return {
		        messages: GiftedChat.append(previousState.messages, arr),
	      	};
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

		this._createMessage(messages)

	}

	_createMessage(data) {
		AsyncStorage.getItem("access_token").then((value) => {
			fetch("http://localhost:3000/messages", {
				method: "POST",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Token token=' + value
				},
				body: JSON.stringify({
					event_id: this.props.event_id,
					content: data[0].text,
				})
			})
			.then((response) => {
				return response.json()
			})
			.then((responseData) => {
				return responseData;
			})
			.then((data) => { 
				// console.log(data)
			})
			.catch(function(err) {
		  	})
			.done();
		}).done();

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
	          _id: this.state.user_id,
	          name: this.state.user_name,
	          avatar: this.state.profile_picture
	        }}
	      />
	    );
  	}
}