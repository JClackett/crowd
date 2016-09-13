'use strict';

import React, { Component } from 'react';
import * as Animatable from 'react-native-animatable';
import { GiftedChat } from 'react-native-gifted-chat';

import {
	AppRegistry,
	StyleSheet,
	AsyncStorage,
	Text,
	View,
	TouchableHighlight,
	AlertIOS,
	TextInput,
	TouchableOpacity,
	Image,
	ScrollView,
	Dimensions,
} from 'react-native';

const window = Dimensions.get('window');
var margin = (window.width)*0.1
var theWidth = (window.width)-margin*2


class Messenger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {messages: []};
    this.onSend = this.onSend.bind(this);
  }
  componentWillMount() {
    this.setState({
      messages: [
        {
          _id: 1,
          text: 'Hello developer',
          createdAt: new Date(Date.UTC(2016, 7, 30, 17, 20, 0)),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://facebook.github.io/react/img/logo_og.png',
          },
        },
      ],
    });
  }
  onSend(messages = []) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, messages),
      };
    });
  }
  render() {
    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={this.onSend}
        user={{
          _id: 1,
        }}
      />
    );
  }
}



/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Styles
------------------------------------------------------------------------------------------------------------------------------------------------------ */

var styles = StyleSheet.create({

	container: {
		flex: 1,
		justifyContent: 'center',

	},

	form_modal: {
		alignItems: 'center',
		height:400,
		width:theWidth,
		borderRadius: 2,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	events_modal: {
		alignItems: 'center',
		height: 250,
		width:theWidth,
		backgroundColor: "#FD7865",
		borderRadius: 20,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	settings_modal: {
		alignItems: 'center',
		height:400,
		width: theWidth,
		borderRadius: 2,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

});

module.exports = Messenger;