'use strict';

import React, { Component, PropTypes } from 'react';
import {GiftedChat, Actions, Bubble, Send} from 'react-native-gifted-chat';

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
		};

		this.onSend = this.onSend.bind(this);
		this.renderBubble = this.renderBubble.bind(this);
		this.renderSend = this.renderSend.bind(this);

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

			var user_arr = arr[i].user;
			user_arr._id = user_arr.id;
			user_arr.avatar = user_arr.facebook_picture;

			delete user_arr.id;
			delete user_arr.facebook_picture;
			delete arr[i].id;
			delete arr[i].content;
			delete arr[i].creator;
			delete arr[i].user.created_at;
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

	renderSend(props) {
		return (
			<Send
				{...props}
				label={'Message'}
				textStyle={{
					color: '#F87960',
				}}
			/>
		);
	}

	renderBubble(props) {
		return (
			<Bubble
				{...props}
				wrapperStyle={{
					left: {
						backgroundColor: '#F87960',
					},
					right: {
						backgroundColor: '#0C4E64',
					}
				}}
				textStyle={{
					left: {
						color: 'white',
					},
					right: {
						color: 'white',
					}
				}}
			/>
		);
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

		var user_id = parseInt(this.state.user_id);

		return (
			<GiftedChat
				messages={this.state.messages}
				onSend={this.onSend}
				user={{
					_id: user_id,
					name: this.state.user_name,
				}}
				renderBubble={this.renderBubble}
				renderSend={this.renderSend}
			/>
		);
	}

}