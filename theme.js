// theme.js
import {
  	Dimensions,
} from 'react-native';

const window = Dimensions.get('window');
var margin = (window.width)*0.1
var theWidth = (window.width)-margin*2

export default {
	theWidth: theWidth,
	margin: margin,
	redColor: '#F87960',
	blueColor: '#074E64',
}