'use strict';

import React, { Component } from 'react';
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

var delete_button;
var join_button;
var leave_button;




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
      			event_guests_pictures: [""],
      			isCreator: false,
      			isGuest: false,

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
		this.setState({form_modal: false});

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
		this.setState({form_modal: true});
	}

	onFormClosed() {
		this.setState({form_modal: false});
	}

	openEvent(id) {

		this._initialise_event(id);

		// Is the user the creator, a guest or not
  		if (this.state.event_creator_id == this.state.user_id) { 
			this.setState({isCreator: true})
			this.setState({isGuest: false})
			delete_button = <Button onPress={this.deleteEvent.bind(this)} style={styles.delete_button}>Delete</Button>
		} else if (this.state.event_users == true) {
			this.setState({isGuest: true})
			// join_button_alt = <Image source={require('../join-event-alt.png')} style={styles.join_button} />
			join_button = <TouchableOpacity onPress={this.leaveEvent.bind(this)}><Image source={require('../leave-event.png')} style={styles.join_button} /></TouchableOpacity>
		} else {
			this.setState({isGuest: true})
			join_button = <TouchableOpacity onPress={this.joinEvent.bind(this)}><Image source={require('../join-event.png')} style={styles.join_button} /></TouchableOpacity>
			// leave_button_alt = <Image source={require('../leave-event-alt.png')} style={styles.leave_button} />

		}

		this.refs.event_modal.open();
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
	  	this.setState({event_guests: event.users});
		this.setState({event_users: false});
		this.setState({isCreator: false});

	  	// See if current user is a guest of the event, if so, will show the leave button^^^
		var x;
		for (x in event.users) {
			var id1 = String(event.users[x].id);
			var id2 = String(this.state.user_id);
			if (id1 === id2){
	  			this.setState({event_users: true});
	  		}
	  	};

	  	// Make array of event guests pictures
	  	var eventGuestsPictureArr = [];

		event.users.slice(0,3).forEach(function(user) {
	    		eventGuestsPictureArr.push(user.facebook_picture)
		});

	  	this.setState({event_guests_pictures: eventGuestsPictureArr});

	}		

	onEventClosed(id) {
		this.setState({event_modal: false});
	}

  	openSettings(id) {
		this.refs.settings_modal.open();

		this.setState({settings_modal: true});

		if (this.state.form_modal == true) {
  			this.refs.form_modal.close();
  		} 

  		if (this.state.event_modal == true ) {
  			this.refs.event_modal.close();
  		} 

		
	}

	onSettingsClosed() {
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
			fetch("http://192.168.3.37:3000/events", {
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

		return 'http://192.168.3.37:3000/events?' + querystring;
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
		return 'http://192.168.3.37:3000/events/' + id;
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
			fetch("http://192.168.3.37:3000/guests", {
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
				response.json().then((response) => {
					this.openEvent(response);
				}).done();
			})
			.then((responseJson) => {
			})
			.then((data) => { 

				// this.setState({event_guests: data.users});
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
			fetch("http://192.168.3.37:3000/guests", {
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
				response.json().then((response) => {
					this.openEvent(response);
				}).done();

			})
			.then((responseJson) => {
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
		var query =  'http://192.168.3.37:3000/events/' + id;

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
					console.log(result);
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
						            onPress={() => this.fetchInfo(marker)}
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
				   Create Button
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}

				<TouchableOpacity onPress={this.openForm.bind(this)} style={styles.add_icon_wrapper} >
				
					<Image 
						source={require('../add-icon.png')}
						style={styles.add_icon} 
					/>
				
				</TouchableOpacity>


				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Event Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}
				<Modal style={styles.events_modal} ref={"event_modal"} backdropOpacity={0.3} animationDuration={300} swipeToClose={this.state.swipeToClose} onClosed={this.onEventClosed.bind(this)} onOpened={this.onEventOpened} onClosingState={this.onEventClosingState}>


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

					<Image 
						source={{uri: "../line.png"}}
					/>

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

					<TouchableOpacity onPress={() => this.openForm()} style={{bottom: 20, right: 20,position: "absolute"}} >
					
						{this.state.isCreator ? <Image source={require('../edit-icon.png')} style={styles.edit_icon} /> : null }
					
					</TouchableOpacity>

					{this.state.isGuest ? join_button : null}
					{this.state.isCreator ? delete_button : null}


				</Modal>

				{/* ------------------------------------------------------------------------------------------------------------------------------------------------------
				   Settings Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}

				<Modal style={styles.settings_modal} ref={"settings_modal"} entry={"top"} swipeToClose={this.state.swipeToClose} onClosed={this.onSettingsClosed.bind(this)} onOpened={this.onSettingsOpened} onClosingState={this.onClosingState} backdropOpacity={0.5}  backdropColor={"white"} >

					<Image
						style={styles.facebook_picture}
						source={{uri: this.state.facebook_picture}}
					/>

					<Text style={styles.profile_name}>
						{this.state.user_name}
					</Text>

					<LoginButton
						style={styles.login_button}
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
				   Create Modal
				------------------------------------------------------------------------------------------------------------------------------------------------------ */}

				<Modal style={styles.form_modal} ref={"form_modal"} position={"top"} swipeToClose={this.state.swipeToClose} onClosed={this.onFormClosed.bind(this)} onOpened={this.onOpen} onClosingState={this.onClosingState} backdropOpacity={0.5}  backdropColor={"white"} >
									

					{/* <TouchableOpacity onPress={this.inviteToEvent.bind(this)} style={{alignItems: 'center'}}>
					
						<Text>Invite</Text>
					
					</TouchableOpacity> */}


					<View style={{marginTop:30}}>

						<Form
							ref="form"
							type={Event}
						/>

					</View>

					<TouchableOpacity onPress={this.saveEvent.bind(this)} style={{alignItems: 'center'}}>
						
						<Image 
							source={{uri: "https://cdn4.iconfinder.com/data/icons/linecon/512/add-128.png"}}
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

  	event_icon: {
		position: "absolute",
  		height: 27,
  		width: 27,
  		top: 4,
  		left: 3.8,
  		borderRadius: 15,
  	},

  	event_marker: {
		position: "absolute",
		top: 0,
		width: 50,
		height: 50,
		left: -8,
  	},

	form_modal: {
		alignItems: 'center',
		marginTop:30,
		height:330,
		width:'$theWidth',
		borderRadius: 20,
		backgroundColor: "#FFF",
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

	login_button: {
		height: 30,
		marginTop:120,
		width:200,
	},

	events_modal: {
		alignItems: 'center',
		height: 350,
		width:'$theWidth',
		backgroundColor: "$redColor",
		borderRadius: 30,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	join_button: {
		position: 'absolute',
		padding: 15,
		bottom: -100,
		left: 0,
		width: 100,
		height:61.43,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},

	leave_button: {
		position: 'absolute',
		padding: 15,
		bottom: -100,
		left: -40,
		width: 100,
		height:61.43,
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
	},


	add_icon_wrapper: {
		position: 'absolute',
		borderRadius: 32.5,
		right: '$margin',
		bottom: '$margin',
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.45,
	},

	add_icon: {
		width: 65,
		height: 65,
	},

	delete_button: {
		position: 'absolute',
		backgroundColor: "#E8534F",
		color: "white",
		textAlign: "center",
		shadowRadius: 2,
		shadowOffset: {width: 1, height: 1},
		shadowColor: 'black',
		shadowOpacity: 0.3,
		padding: 15,
		bottom: -120,
		left: -150,
		letterSpacing: 1,
		fontSize: 15,
		fontFamily: 'Helvetica',
		width: "$theWidth",
	},

	edit_icon: {
		height :30,
		width: 30,
		bottom: 50,

	},

	facebook_picture: {
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
		marginTop: 10,
  		height: 40,
  		borderColor: "white",
  		width: 40,
  		borderRadius: 20,
  		borderWidth: 2,
  		borderColor: "#FFF"
	},
	'event_guest:last-child': {
	},
	'event_guest:first-child': {
		left:0,
	},

	event_guest_count: {
  		color: "#FFF",
		marginTop: 10,
	},

});

module.exports = MapPage;