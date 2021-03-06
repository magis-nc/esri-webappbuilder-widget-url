# esri-webappbuilder-widget-url
Widget Url (extent tracking in URL and communication between url and others widgets) for WebApp Builder for Arcgis.
Made by MAGIS SARL, New Caledonia. www.magis.nc
Licence GPL V2 (see LICENSE file)

This is a javascript widget for the WebApp Builder for Arcgis.
https://developers.arcgis.com/web-appbuilder/guide/xt-welcome.htm

This widget tracks parameters in url (in navigator history).

## Extent tracking
The widget tracks extent's changes in map (in map's projection). 
2 modes availables :
- extent parameter (4 coordinates + projection (wkid) separated by commas)
- center (2 coordinates + projection (wkid) separated by a comma) and scale parameters
When the user navigates with return or forward buttons of the web browser, the map goes to previous or next extent without page reloading.
When extent param(s) are in url on page loading, the map goes to this extent.

## Communication between url and other widgets
This plugin is designed to be an interface between url (history navigation in web browser) and others widgets.
It uses the standard mecanism of communication between widgets :
https://developers.arcgis.com/web-appbuilder/guide/communication-between-widgets.htm

### Listening other widgets
The widget listen to all widgets communications (launched with their publishData method).
If the data structure is correct, the params are added in url and navigator's history.

Example of correct data received :
```
{
    "toUrl":{
        "params":{
            "myVar":"value",
            "myNumber":1        
        },
        "eraseMode":true
    }
}
```
NB : the eraseMode is optionnal. (default = false)
If set to true, all other parameters in current url are dropped.
If set to false (or not set), the parameters in data are added in url without removing the currents.
This example will make this in url params : ?myVar=value&myNumber=1


### Sending to other widgets
The widget send url data on every url change (page loading or browser navigation with return or forward buttons).
Example of data sent :
```
{
    "url-changed":{
        "url":"http://myurl/?myVar=value&myNumber=1",
        "params":{
            "myVar":"value",
            "myNumber":1        
        },
        "type":"update"
    }
}
```
NB : the type can be start (on page load) or update.

Example of listening use :
A search widget send string searched in url when user submit a search (search=mysearch)
If the user go back in his browser's history, the url widget send the previous search and the search widget can relaunch this previous search.


### Installation
The widget has no UI. It must be added in the config.json manually (in WidgetOnScreen section).

The url folder must be added in widgets directory and added in your config.json, in widgetsOnScreen section.

config.json
```
"widgetOnScreen": {
    "widgets": [
	{
		"uri": "widgets/Url/Widget"
	}, 
	...
	...
	...
```	

To enable it in the WebApp builder (wab) Developper edition builder :
- add the widget to client\stemapp\widgets folder
- in client\stemapp\config.json : in widgetOnScreen section, add the Url widget
- (wab < 1.1) : Like in stemapp config.json, add the url in builder default config.json : client\builder\predefined-apps\default2DApp\config.json
- (wab >= 1.1) : Like in stemapp config.json, add the url in builder default config.json : client\stemapp\predefined-apps\default\config.json

NB : if you want the widget to be available but not active by default, add the visible parameter on false in config.json (stemapp and default app) :
```
"widgetOnScreen": {
    "widgets": [
	{
		"uri": "widgets/Url/Widget",
		"visible": false
	}, 
	...
	...
	...
```	


