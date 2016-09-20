'use strict';

import React, { Component } from 'react';
import * as Animatable from 'react-native-animatable';

import {
	StyleSheet,
	AsyncStorage,
	Text,
	View,
  	TextInput,
  	TouchableOpacity,
  	Image,
  	Dimensions,
  	StatusBar
} from 'react-native';


import EStyleSheet from 'react-native-extended-stylesheet';
import theme from '../theme';


const FBSDK = require('react-native-fbsdk');

const {
	LoginButton,
	GraphRequest,
	GraphRequestManager,
	LoginManager,
	AccessToken,
	AppInviteDialog,
} = FBSDK;

import MapView from 'react-native-maps';

import Modal from 'react-native-modalbox';
import Button from 'react-native-button';

import t from 'tcomb-form-native';
var Form = t.form.Form;

import LoginPage from './LoginPage';
var loginButton;

// Set up the styling using theme.js
EStyleSheet.build(theme);

var Event = t.struct({
	title: t.String,              
	description: t.maybe(t.String),
	howLongWillItLast: t.Number,    
});

var formOptions = {};

/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Main Page
------------------------------------------------------------------------------------------------------------------------------------------------------ */

class MapPage extends Component {
  	
  	watchID: ?number = null;

  	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Initializers
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	constructor(props) {
	    	super(props);

	    	this.state = {
		      	initialPosition: 'unknown',
		    	lastPosition: 'unknown',
			center: {
				latitude: 0,
				longitude: 0
			},
			zoom: 14,
			animated: true,
	  		isOpen: false,
			swipeToClose: true,
			sliderValue: 0.3,
	  		name: 'initial',
	  		region: {
			      	latitude: 0,
			      	longitude: 0,
			      	latitudeDelta: 0,
			      	longitudeDelta: 0,
			},
			markers: [],
      			event_guests_pictures: [""]
    		};

  	}	

  	componentDidMount() {
		navigator.geolocation.getCurrentPosition(
			(position) => {     	
		        		this.setState({
			        		center: {
			          			latitude: position.coords.latitude,
			          			longitude: position.coords.longitude
			        		},
			        		region: {
					      	latitude: position.coords.latitude,
			          			longitude: position.coords.longitude,
			          			latitudeDelta: 0.5,
		      				longitudeDelta: 0.1,
			        		},
			        	});

				this._onMapLoad(this.state.center);
			},

  			(error) => alert(error.message),
	      		{enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
		);

		this.watchID = navigator.geolocation.watchPosition((position) => {
			this.setState({
		        		center: {
		          			latitude: position.coords.latitude,
		          			longitude: position.coords.longitude
		        		},
		        		region: {
				      	latitude: position.coords.latitude,
		          			longitude: position.coords.longitude,
		          			latitudeDelta: 0.09,
	      				longitudeDelta: 0.0421,
		        		},
		        	});

		});

	  	this._loadInitialState().done();
		
	  	// this.refs.join_button.fadeOut(1);

	}

  	componentWillUnmount() {
  		navigator.geolocation.clearWatch(this.watchID);
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
		this.setState({event_modal: false});
		this.setState({settings_modal: false});
		this.setState({create_modal: false});

		const inviteLinkContent = {
			applinkUrl: "https://fb.me/1756096064669863",
		};

		this.setState({inviteLinkContent: inviteLinkContent});

  	  	this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));

	}

  	onNavigatorEvent(event) { // this is the onPress handler for the two buttons together
	   	if (event.type == 'NavBarButtonPress') { // this is the event type for button presses
	      		if (event.id == 'settings') { // this is the same id field from the static navigatorButtons definition
				this.openSettings()
			}
      		}
    	}

  	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
  	   Modal
  	------------------------------------------------------------------------------------------------------------------------------------------------------ */

	openForm(id) {
		this.refs.form_modal.open();
		this.setState({create_modal: true});
		this.refs.create_button.bounceOutDown(1000)
	}

	closeForm(id) {
		this.refs.form_modal.close();
	}

	onFormClosed() {
		this.refs.create_button.bounceInUp(800)
		this.setState({create_modal: false});
	}

	openEvent(id) {

		this._initialise_event(id);

	 	this.refs.event_modal.open();

		// Is the user the creator, a guest or not
  		if (this.state.event_creator_id == this.state.user_id) { 
			loginButton = <Button onPress={this.deleteEvent.bind(this)} style={styles.delete_button}>Delete</Button>;
			this.setState({update_button: true});
		} else if (this.state.event_users == true) {
			loginButton = <Button onPress={this.leaveEvent.bind(this)} style={styles.main_button}>Leave</Button>;
			this.setState({update_button: true});
		} else {
		  	loginButton = <Button onPress={this.joinEvent.bind(this)} style={styles.main_button}>Crash</Button>;
			this.setState({update_button: true});
		}

	  	if (this.state.event_modal == false) {
	  		this.refs.create_button.bounceOutDown(500);
			this.refs.join_button.bounceInUp(500);
		}

		this.setState({event_modal: true});

	}


	_initialise_event(event) {
	  	this.setState({event_title: event.title});
	  	this.setState({event_description: event.description});
	  	this.setState({event_users_length: event.users.length});
		this.setState({event_id: event.id});
	  	this.setState({event_creator_id: event.creator.id});
	  	this.setState({event_creator_name: event.creator.name});
	  	this.setState({event_creator_picture: event.creator.facebook_picture});


	  	// See if current user is a guest of the event, if so, will show the leave button^^^
		var x;
		for (x in event.users) {
			var id1 = String(event.users[x].id);
			var id2 = String(this.state.user_id);
			if (id1 === id2){
	  			this.setState({event_users: true});
	  		}
	  	};
	  	
	  	var eventGuestsPictureArr = [];

		event.users.slice(0,3).forEach(function(user) {
	    		eventGuestsPictureArr.push(user.facebook_picture)
		});

	  	this.setState({event_guests_pictures: eventGuestsPictureArr});


	}		

	closeEvent(id) {
		this.refs.event_modal.close();
	}

	onEventClosed(id) {
		this.setState({event_modal: false});

		if (this.state.settings_modal == false) {
			this.refs.create_button.bounceInUp(500);
			this.refs.join_button.bounceOutDown(500);
		}
	}

  	openSettings(id) {
		this.refs.settings_modal.open();
		this.setState({settings_modal: true});

		if (this.state.event_modal == true) {
			this.refs.event_modal.close();
			this.refs.join_button.bounceOutDown(500);
		}
		else {
			this.refs.create_button.bounceOutDown(500);
		}
	}

	closeSettings(id) {
		this.refs.settings_modal.close();
	}	

	onSettingsClosed() {
		this.refs.create_button.bounceInUp(500);
		this.setState({settings_modal: false});
	}

	saveEvent() {
		// call getValue() to get the values of the form
		var value = this.refs.form.getValue();
		if (value) { // if validation fails, value will be null
			this._createEvent(value);
			this.refs.form_modal.close();
		}
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Create Event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	_createEvent(details) {
		AsyncStorage.getItem("access_token").then((value) => {
			fetch("http://localhost:3000/events", {
				method: "POST",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Token token=' + value
				},
				body: JSON.stringify({
					title: details.title,
					description: details.description,
					latitude: this.state.center.latitude,
					longitude: this.state.center.longitude,
					endtime: details.howLongWillItLast,
				})
			})
			.then((response) => {
				return response.json()
			})
			.then((responseData) => {
				return responseData;
			})
			.then((data) => { 
				var query = this._urlForQuery(this.state.center);
	  			this._getEvents(query);
			})
			.catch(function(err) {
		  	})
			.done();
		}).done();

	}


	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   GET Events & Display
	------------------------------------------------------------------------------------------------------------------------------------------------------ */

	_urlForQuery(center) {
	  	var params = {
		      	latitude: center.latitude,
		      	longitude: center.longitude,
	  	};
	 
		var querystring = Object.keys(params)
		.map(key => key + '=' + encodeURIComponent(params[key]))
		.join('&');

		return 'http://localhost:3000/events?' + querystring;
	}

	_onMapLoad(center) {
	  	var query = this._urlForQuery(center);
	  	this._getEvents(query);
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Index Events
	------------------------------------------------------------------------------------------------------------------------------------------------------ */

	_getEvents(query) {
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
			   		this._displayEvents(data);
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



	_displayEvents(events) {
		var Events = [];
		events.forEach(function(event) {
    		Events.push({
    			key: event.id,
    			id: event.id,
        		latitude: event.latitude, 
        		longitude: event.longitude,		
        		icon: event.creator.facebook_picture 	
		    })
		});

		this.setState({
			markers:
  				Events
		});

	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Show Event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	fetchInfo(event) {
	  	var infoQuery = this._urlForInfoQuery(event);
	  	this._getEventInfo(infoQuery);
	}

	_urlForInfoQuery(event) {
		var id = event.id;
		return 'http://localhost:3000/events/' + id;
	}

	_getEventInfo(infoQuery) {

		AsyncStorage.getItem("access_token").then((value) => {
			fetch(infoQuery,{
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
			   		this.openEvent(data);
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
	   Join Event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	joinEvent() {
		AsyncStorage.getItem("access_token").then((value) => {
			fetch("http://localhost:3000/guests", {
				method: "POST",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Token token=' + value
				},
				body: JSON.stringify({
					event_id: this.state.event_id,
					user_id: this.state.user_id,
				})
			})
			.then((response) => {
				var event_id = this.state.event_id;
				var query = 'http://localhost:3000/events/' + event_id;
	  			this._getEventInfo(query);
				return response.json()
			})
			.then((responseData) => {
				return responseData;
			})
			.then((data) => { 
				this.setState({guest_id: data.id})
			})
			.catch(function(err) {
		  	})
			.done();
		}).done();
		
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Leave event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	leaveEvent() {
		AsyncStorage.getItem("access_token").then((value) => {
			fetch("http://localhost:3000/guests", {
				method: "DELETE",
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Token token=' + value
				},
				body: JSON.stringify({
					event_id: this.state.event_id,
					user_id: this.state.user_id,
				})
			})
			.then((response) => {
				this.setState({event_users: false});
				var event_id = this.state.event_id;
				var query = 'http://localhost:3000/events/' + event_id;
	  			this._getEventInfo(query);
				return response.json()
			})
			.then((responseData) => {
				return responseData;
			})
			.then((data) => { 
				
			})
			.catch(function(err) {
		  	})
			.done();
		}).done();
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Delete event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */

	deleteEvent() {
		var id = this.state.event_id;
		var query =  'http://localhost:3000/events/' + id;

		AsyncStorage.getItem("access_token").then((value) => {
			fetch(query,{
				method: "DELETE",
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
			})
			.catch(function(err) {
				console.log(err);
		  	})
			.done(()=> {
				var newQuery = this._urlForQuery(this.state.center);
				this._getEvents(newQuery);
			});

		}).done();

		this.refs.event_modal.close();
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Invite to Event
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	inviteToEvent() {
		var tmp = this;
		AppInviteDialog.canShow(this.state.inviteLinkContent).then(
			function(canShow) {
				if (canShow) {
					return AppInviteDialog.show(tmp.state.inviteLinkContent);
				}
			}
		).then(
			function(result) {
				if (result.isCancelled) {
					alert('invite cancelled');
				} else {
					alert('invite success with postId: '+ result.postId);
				}
			},
			function(error) {
				alert('invite fail with error: ' + error);
			}
		);
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Open Messenger
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
	openMessenger(event_id) {

		this.props.navigator.push({
			screen: "Crowd.Messenger",
		    navigatorStyle: {
		    	navBarTextColor: '#fff',
			  	navBarBackgroundColor: '#074E64',
			  	navBarButtonColor: '#fff',
		      	statusBarTextColorScheme: 'light'
		    },
		    passProps: {event_id: event_id},
			titleImage: require('./../logo.png'),
	      	statusBarTextColorScheme: 'light'
		});
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------
	   Render
	------------------------------------------------------------------------------------------------------------------------------------------------------ */
  	render() {

		return (

    			<View style={styles.container}>

		    		<MapView
		    			style={styles.map}
				          	showsUserLocation={true}
				          	followsUserLocation={true}
			  	>

				  		{this.state.markers.map(marker => (
							<MapView.Marker
							    	style={styles.marker}
							    	key={marker.key}
							      	coordinate={{
							              	latitude: marker.latitude,
							              	longitude: marker.longitude
							            }}
							            onSelect={() => this.fetchInfo(marker)}
							            flat= {true}
							            centerOffset= {{
							            	x: 11,
							              	y: -22
							            }}
							>
								<View style={styles.container}>
								        	<View style={styles.marker}>
									        	<Image 
											source={require('../map-marker.png')}
											style={styles.event_marker}
										/>
									          	<Image 
											source={{uri: marker.icon}}
											style={styles.event_icon}
										/>
									</View>
								</View>
							</MapView.Marker>
					  	))}

				</MapView>
				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Event Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}
				<Modal style={styles.events_modal} ref={"event_modal"} backdropOpacity={0.3} animationDuration={300} swipeToClose={this.state.swipeToClose} onClosed={this.onEventClosed.bind(this)} onOpened={this.onEventOpened} onClosingState={this.onEventClosingState}>

					{
						this.state.event_guests_pictures.map(function(picture, index){
							return (
									<Image 
										key={index}
										source={{uri: picture}}
										style={EStyleSheet.child(styles, 'event_guest', index, this.state.event_guests_pictures.length)}
									/>
								)

						}.bind(this))
					}

					<Text style={styles.event_guest_count}>
						{this.state.event_users_length + " going"}
					</Text>

					<Image 
						source={{uri: this.state.event_creator_picture}}
						style={styles.event_creator}
					/>

					<TouchableOpacity onPress={() => this.openMessenger(this.state.event_id)} style={{top: 0, right: 0,position: "absolute"}} >
					
						<Image 
							source={require('../message-icon.png')}
							style={styles.message_icon} 
						/>
					
					</TouchableOpacity>
					

					<Text style={styles.event_creator_name}>
						{this.state.event_creator_name}
					</Text>

		
					<Text style={styles.event_title}>
						{this.state.event_title}
					</Text>

					<Text style={styles.event_description}>
						{this.state.event_description}
					</Text>

				</Modal>

				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Settings Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}

				<Modal style={styles.settings_modal} ref={"settings_modal"} entry={"top"} swipeToClose={this.state.swipeToClose} onClosed={this.onSettingsClosed.bind(this)} onOpened={this.onSettingsOpened} onClosingState={this.onClosingState} backdropOpacity={0.5}  backdropColor={"white"} >

					<Image
						style={styles.facebook_icon}
						source={{uri: this.state.facebook_picture}}
					/>

					<Text style={styles.profile_name}>
						{this.state.user_name}
					</Text>

					<LoginButton
						style={styles.login}
						readPermissions={["public_profile", "email", "user_friends"]}
						onLogoutFinished={ () =>
							this.props.navigator.push({
								screen: 'Crowd.LoginPage', 
								navigatorStyle: {
							    	navBarHidden: true,
							      	statusBarTextColorScheme: 'light'
							    }
							})
						}
						/>

				</Modal>

				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Main Buttons
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}
				<Animatable.View ref="join_button">
					{loginButton}
				</Animatable.View>


				<Animatable.View ref="create_button">
					<Button onPress={this.openForm.bind(this)} style={styles.main_button}>What are you up to?</Button>
				</Animatable.View>

				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Create Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}

				<Modal style={styles.form_modal} ref={"form_modal"} swipeToClose={this.state.swipeToClose} onClosed={this.onFormClosed.bind(this)} onOpened={this.onOpen} onClosingState={this.onClosingState} backdropOpacity={0.5}  backdropColor={"white"} >
									

					{/*<TouchableOpacity onPress={this.inviteToEvent.bind(this)} style={{alignItems: 'center'}}>
					
						<Text>Invite</Text>
					
					</TouchableOpacity>*/}


					<View style={{marginTop:30}}>

						<Form
							ref="form"
							type={Event}
						/>

					</View>

					<TouchableOpacity onPress={this.saveEvent.bind(this)} style={{alignItems: 'center'}}>
						
						<Image 
							source={{uri: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678134-sign-check-128.png"}}
							style={styles.tick_icon}
						/>
						
					</TouchableOpacity>

				</Modal>

			</View>

		);

  	}

}


/* ------------------------------------------------------------------------------------------------------------------------------------------------------
   Styles
------------------------------------------------------------------------------------------------------------------------------------------------------ */

const styles = EStyleSheet.create({

	container: {
		position: 'absolute',
	    top: 0,
	    left: 0,
	    right: 0,
	    bottom: 0,
	    justifyContent: 'flex-end',
  	},

  	marker: {
  		height: 55,
  		width: 55,
  	},

  	map: {
	    position: 'absolute',
	    top: 0,
	    left: 0,
	    right: 0,
	    bottom: 0,
 	},

	icon: {
		borderRadius: 25
	},

  	event_icon: {
  		height: 33,
  		width: 33,
  		borderRadius: 20,
  	},

  	event_marker: {
		width: 55,
		height: 55,
		position: "absolute",
		top: -3,
		left: -11,
  	},

	form_modal: {
		alignItems: 'center',
		height:300,
		width:'$theWidth',
		borderRadius: 20,
		backgroundColor: "#FFF",
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	events_modal: {
		alignItems: 'center',
		height: 250,
		width:'$theWidth',
		backgroundColor: "$redColor",
		borderRadius: 30,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	settings_modal: {
		alignItems: 'center',
		height:400,
		width: '$theWidth',
		borderRadius: 2,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	button: {
		backgroundColor: '#1ECE6D',
		padding: 10,
		color: "white",
		marginTop:20,
		width: 170,
		letterSpacing: 1,
		fontSize: 14,
		justifyContent: 'center'
	},

	main_button: {
		position: 'absolute',
		backgroundColor: "$redColor",
		color: "white",
		textAlign: "center",
		padding: 15,
		margin: '$margin',
		bottom: '$margin',
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.45,
		letterSpacing: 1,
		fontSize: 15,
		fontFamily: 'Helvetica',
		width: '$theWidth',
	},

	delete_button: {
		position: 'absolute',
		backgroundColor: "#E8534F",
		color: "white",
		textAlign: "center",
		padding: 15,
		margin: '$margin',
		bottom: '$margin',
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.45,
		letterSpacing: 1,
		fontSize: 15,
		fontFamily: 'Helvetica',
		width: '$theWidth',
	},

	settings_button: {
		position: 'absolute',
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.45,
		bottom: 610,
		left: 10,
		width:30,
		height:30,
	},

	facebook_icon: {
		width: 100,
		height: 100,
		marginTop:40,
		borderRadius: 50,
  	},

  	profile_name: {
		color: "#FFF",
  		fontSize:18,
  		textAlign: "center",
  		fontWeight: "600",
  		marginTop:10,
  	},

  	arrow_icon: {
		width: 20,
		height: 20,
  	},

  	tick_icon: {
  		width: 60,
  		height: 60,
  	},

  	event_creator: {
  		height: 90,
  		borderWidth: 2,
  		borderColor: "white",
  		width: 90,
  		marginTop: 20,
  		borderRadius: 45,
  	},

  	event_creator_name: {
  		color: "#FFF",
  		fontSize:14,
  		fontWeight: "500",
  		marginTop:5,
  		textAlign: "center",
  	},

  	message_icon: {
  		height: 40,
  		width: 41,
  		marginTop:10,
  		marginRight:10,
  	},

  	event_title: {
  		color: "#FFF",
  		fontSize:20,
  		textAlign: "center",
  		fontWeight: "600",
  		marginTop:30,
  	},

  	event_description: {
  		color: "#FFF",
  		fontSize:13,
  		textAlign: "center",
  		fontWeight: "400",
  		marginTop:5,
  	},
	event_guest: {
  		position: "absolute",
  		height: 40,
  		borderColor: "white",
  		width: 40,
  		top:0,
  		marginTop: 10,
  		left: 30,
  		borderRadius: 20,
  		borderWidth: 2,
  		borderColor: "#FFF"
	},
	'event_guest:last-child': {
		left:50,
	},
	'event_guest:first-child': {
		left:10,
	},

	event_guest_count: {
  		color: "#FFF",
  		left: 30,
		position: 'absolute',
		marginTop: 50,
	},

	login: {
		height: 30,
		marginTop:120,
		width:200,
	},
});

module.exports = MapPage;