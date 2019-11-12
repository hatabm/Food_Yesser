import { Component, ViewChild, ElementRef, NgZone, DebugElement } from '@angular/core';
import { ToastController, LoadingController, AlertController, Alert, NavController } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Headers, RequestOptions, Http, Response, URLSearchParams } from '@angular/http';
import {GoogleMaps, GoogleMap, GoogleMapsEvent, Marker,GoogleMapsAnimation,
  MyLocation, Environment,Geocoder,GeocoderResult,Circle, ILatLng,Spherical, HtmlInfoWindow, MarkerCluster, CameraPosition} from '@ionic-native/google-maps';
import { SelectItem } from 'primeng/components/common/selectitem';
//import * as introJs from '../../../node_modules/intro.js/intro.js' ;
import { MenuItem } from 'primeng/api';

declare var google;
//declare var introJs: any;
declare global {
  interface Storage {
    setObject(key: string, value: any);
    getObject(key: string): any;
    hasKey(key: string): boolean;
  }
}
Storage.prototype.setObject = function (key: string, value: any) {
  this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function (key: string): any {
  var value = this.getItem(key);
  return value && JSON.parse(value);
}
Storage.prototype.hasKey = function (key: string): any {
  for (var i = 0; i < localStorage.length; i++)
    if (localStorage.key(i) == key)
      return true;
  return false;
}
//declare var require: any
//const IntroJs = require("../../../node_modules/intro.js/intro");


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: MenuItem[];
  Point: any// { latitude: number, longitude: number };
  map: GoogleMap;
  @ViewChild('map22') mapElement: ElementRef;
  @ViewChild('search_address') search_address: ElementRef;
  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems: any[] = [];
  geocoder: any;
  marker: Marker;
  LastLng: any;
  LastLat: any;
  loading: any;
  ATMSLst: any[] = [];
  ParkLst: any[] = [];
  DiffDays: any;
  dataDetails: any[] = [];
  CheckInLocation: any;
  overlayHidden: boolean = true;
  DetailsAddress: string = "";
  DetailsAddressType: string = "";
  CurrentAddress: string = "";

  HideMainCard: boolean = false;
  HideDetailsCard: boolean = true;
  HideCheckInPage: boolean = true;
  HideMapPage: boolean = false;
  HideAboutPage: boolean = true;
  ZoomLatLng: { lat: number, lng: number };
  TypeOfInteraction: any[] = [];
  InteractionId: number = 0;
  PointType: any[] = [];
  PointTypeId: any;
  NearByCheckIn: any[] = [];
  MapLocLoad: boolean;
  ATMToUserCheckIn: any[] = [];
  ParkToUserCheckIn: any[] = [];
  PlaceId: any;
  SelectedPlaceCheckIn: any = {};
  placeIdRequire: boolean = false;
  PointTypeIdRequire: boolean = false;
  ATMParkUserCkecksLST: any[] = [];
  DivDetailsSrc: string = "";
  DivDetailsStyle: any;
  DivDetailsPargraph: string = "";
  ParagraphDetailsStyle: any;
  ImageStyleIncaseUser: any;

  ATMParkUserToCheckIn: any[] = [];
  PlaceCheckInCount: number = 0;
  HideCheckSuccessCard: boolean = true;
  flage = true;
  _markerCluster: MarkerCluster;
  _hrefNavigation: string = "";
  constructor(public toastCtrl: ToastController, public http: Http, private navCtrl: NavController,
    public Zone: NgZone, public loadingCtrl: LoadingController, public alerCtrl: AlertController) {
    try {
      this.GoogleAutocomplete = new google.maps.places.AutocompleteService();

    } catch (e) {
      console.log("e", e)
    }
    this.autocomplete = { input: '' };
    let SkipIntro = localStorage.getObject('SkipIntro');
  }

  ionViewDidLoad() {

    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    let DateOfData = localStorage.getObject('DataDate');
    if (DateOfData != null) {
      const date1 = new Date(DateOfData);
      const date2 = new Date();
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      this.DiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    this.loadMap();
    this.TypeOfInteraction = [
      { value: 1, label: "All Near By" },
      { value: 2, label: "Parking" },
      { value: 3, label: "ATM" },
      { value: 4, label: "Add New Point" }
    ]

    this.PointType = [
      { value: 1, label: "Park" },
      { value: 2, label: "ATM" },
    ]
    this.items = [{
      label: 'About Us',
      command: (event) => {
        this.DisplayAboutUs();
      }

    },
    {
      icon: 'pi pi-replay',
      label: 'Open Data Portal',
      url:'https://data.gov.sa'
    }
    ];

  }
  DisplayAboutUs() {
    this.HideAboutPage = false;
    this.HideMapPage = true;
    this.HideCheckInPage = true;
  }
  loadMap() {

    this.map = GoogleMaps.create('map_canvas', {
      camera: {
        zoom: 16,
        tilt: 30
      }
    });
    this.loading.present();
    this.map.clear();
    this.map.getMyLocation()
      .then((location: MyLocation) => {
        this.map.animateCamera({
          target: location.latLng,
          zoom: 16,//14
          tilt: 30
        }).then(() => {
          this.loading.dismiss();
          // add a marker
          this.marker = this.map.addMarkerSync({
            //title: 'Click Her To Find Nearst Park & ATM ',
            //snippet: '',
            position: location.latLng,
            animation: GoogleMapsAnimation.BOUNCE,
            "icon": {
              url: "assets/imgs/MyLocation.png",
              size: {
                width: 50,
                height: 50,
              }
            }
          });
          this.MapLocLoad = true;
          this.Point = location.latLng;
          this.CheckInLocation = location.latLng;
          this.marker.showInfoWindow();
          this.DrawATMS();
          this.DrawPark();
          this.DrawUserChecks();
          this.map.on(GoogleMapsEvent.CAMERA_MOVE_START).subscribe((endRes) => {
            this.Point = endRes[0].target;
            this.FormateAtmData();
            this.FormateParkData();
            this.FormateUserChecksData();
          });
          Geocoder.geocode({
            "position": this.CheckInLocation
          }).then((results: GeocoderResult[]) => {
            this.autocomplete.input = results[0].extra.lines.toString();
            this.CurrentAddress = results[0].extra.lines.toString();
          });
        });
      }, reason => {
        alert("Error")
        //alert(reason); // Error!
      });
  }

  selectSearchResult(item) {
    // fire when choose result from dwlist of plaes
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();
    this.autocomplete.input = item.description;

    Geocoder.geocode({
      "address": item.description //page.search_address.nativeElement.value
    })
      .then((results: GeocoderResult[]) => {
        this.loading.dismiss();
        this.marker = this.map.addMarkerSync({
          'position': results[0].position,
          "icon": {
            url: "assets/imgs/MyLocation.png",
            size: {
              width: 50,
              height: 50,
            }
          }
        });

        this.map.animateCamera({
          'target': results[0].position,
          'zoom': 16
        }).then(() => {
          this.marker.showInfoWindow();
        })
        this.MapLocLoad = false;
        this.Point = results[0].position;
        this.FormateAtmData();
        this.FormateParkData();

      });
  }
  updateSearchResults() {
    // fire when write on search box
    try {
      if (this.autocomplete.input == '')
        this.autocompleteItems = [];
      else {
        this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
          (predictions, status) => {
            this.autocompleteItems = [];
            this.Zone.run(() => {
              if (predictions == null)
                this.autocompleteItems = [];
              else {
                predictions.forEach((prediction) => {
                  this.autocompleteItems.push(prediction);
                });
              }
              this.autocompleteItems = this.autocompleteItems;
            });
          });
      }
    } catch (e) {
      console.log(e)
    }
  }
  computeDistanceBetweenLanLng(position, latLng) {
    var BLoc: any = { lat: latLng.lat(), lng: latLng.lng() } //new google.maps.LatLng(position.lat, position.lng);
    let newValue1: ILatLng = <ILatLng>position;
    let newValue2: ILatLng = <ILatLng>BLoc;
    let Distance: number = Spherical.computeDistanceBetween(newValue1, newValue2);
    return Distance;
  }

  DrawATMS() {

    //let DataFromStorage = localStorage.getObject('ATMSLst');

    //if (DataFromStorage != null && DataFromStorage.length > 0 && this.DiffDays < 29) {
    //  this.ATMSLst = DataFromStorage;
    //  this.FormateAtmData();
    //}
    //else {
      let limit = Number.MAX_SAFE_INTEGER;
      let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=e21abc9c-8825-4d23-b0b4-8179e88d6667&limit=" + limit;
      let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
      let Roption = new RequestOptions({ 'headers': header });
      this.http.get(Url, Roption)
        .subscribe(response => {

          let res = response.json();
          var result = res.result.records;
          if (result != undefined && result.length > 0) {
            if (result.length > 0) {
              this.ATMSLst = result;
              // localStorage.setObject('ATMSLst', this.ATMSLst);
             // localStorage.setObject('DataDate', new Date());
              this.FormateAtmData();
            }
          }
        }, function (e) {
          console.log("error", e)
        })
    //}
  }
  FormateAtmData() {
    if (this.ATMSLst.length > 0) {
      for (var i = 0; i < this.ATMSLst.length; i++) {
        let latLng = new google.maps.LatLng(this.ATMSLst[i]["Y GIS Coordinates"], this.ATMSLst[i]["X GIS Coordinates"]);

        let dist = this.computeDistanceBetweenLanLng(this.Point, latLng);
        this.ATMSLst[i].Distance = dist;
        this.ATMSLst[i].latLng = latLng;
      }
      this.ATMSLst.sort((a, b) => a.Distance - b.Distance);
      this.dummyAtmData()
      //this.addAtmCluster(this.dummyAtmData());

      if (this.MapLocLoad == true)
        this.ATMToUserCheckIn = this.ATMSLst;


    }
  }
  dummyAtmData() {
    let d = [];

    for (var i = 0; i < 20; i++) {
      //d.push(
      //  {
      //    "position": {
      //      "lat": this.ATMSLst[i].latLng.lat(),
      //      "lng": this.ATMSLst[i].latLng.lng()
      //    },
      //    // "title": this.ATMSLst[i]["الموقع"],
      //    "icon": {
      //      url: "assets/imgs/ATM.png",
      //      size: {
      //        width: 30,
      //        height: 30,
      //      }
      //    },
      //    Id: i,
      //    //snippet: this.ATMSLst[i]["id"].toString(),
      //    customInfo: this.ATMSLst[i]["id"],
      //  }
      //)
      let NewMarker =this.map.addMarkerSync({
        "position": {
          "lat": this.ATMSLst[i].latLng.lat(),
          "lng": this.ATMSLst[i].latLng.lng()
        },
        "icon": {
          url: "assets/imgs/ATM.png",
          size: {
            width: 30,
            height: 30,
          }
        },
        Id: i,
        customInfo: this.ATMSLst[i]["id"],
        
      });
      NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERATMClick(params, this, NewMarker))
    }
    //return d;
  }
  addAtmCluster(data) {
    //let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
    //  markers: data,
    //  icons: [

    //  ]
    //});
    //this._markerCluster = this.map.addMarkerClusterSync({
    //  markers: data,
    //  icons: [

    //  ]
    //});

    //this._markerCluster.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERClick(params, this));
  //  google.maps.event.addListener(this._markerCluster, "click", (params) => this.MARKERClick(params, this));
    
  }

  MARKERATMClick(params, _thisPage: HomePage, NewMarker) {
       
      let marker: Marker = <Marker>params[1];
      let Id: any = marker.get('customInfo');
      let obj = _thisPage.ATMSLst.find(a => a.id == Id);

      _thisPage.ZoomLatLng = { lat: obj["Y GIS Coordinates"], lng: obj["X GIS Coordinates"] }
      _thisPage.DetailsAddressType = "ATM";
      _thisPage.DetailsAddress = obj['الموقع'] + " , " + obj['City Arabic'];

      _thisPage.HideMainCard = true;
      _thisPage.HideDetailsCard = false;
      _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
      _thisPage.DivDetailsSrc = "assets/imgs/ATM.png";
      _thisPage.DivDetailsStyle = {
        'background-color': '#d4f1e2'
      };
      _thisPage.DivDetailsPargraph = "ATM";
      _thisPage.ParagraphDetailsStyle = {
        'color': '#37a76f'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + "," +
      this.CheckInLocation.lng + "/" + obj["Y GIS Coordinates"] + "," + obj["X GIS Coordinates"];
       NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERATMClick(params, _thisPage, NewMarker))
    }
  

  DrawPark() {
    //let DataFromStorage = localStorage.getObject('ParkLst');
    //if (DataFromStorage != null && this.DiffDays < 29) {
    //  this.ParkLst = DataFromStorage;
    //  this.FormateParkData();
    //}
    //else {
      let limit = Number.MAX_SAFE_INTEGER;
      let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=78708537-8606-4c88-916c-734b1bf38c5d&limit=" + limit;
      let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
      let Roption = new RequestOptions({ 'headers': header });
      this.http.get(Url, Roption)
        .subscribe(response => {

          let res = response.json();
          var result = res.result.records;
          // alert(result);
          if (result != undefined && result.length > 0) {
            this.ParkLst = result;
      //      localStorage.setObject('ParkLst', this.ParkLst);
            this.FormateParkData();
          }
        }, function (e) {
          console.log("error", e)
        })
   // }
  }
  FormateParkData() {
    if (this.ParkLst.length > 0) {
      for (var i = 0; i < this.ParkLst.length; i++) {
        let latLng = new google.maps.LatLng(this.ParkLst[i].latd, this.ParkLst[i].lngd);
        this.ParkLst[i].latLng = latLng;
        this.ParkLst[i].Distance = this.computeDistanceBetweenLanLng(this.Point, latLng);
      }
      this.ParkLst.sort((a, b) => a.Distance - b.Distance);
     // this.addParkCluster(this.dummyParkData());
      this.dummyParkData()
      if (this.MapLocLoad == true)
        this.ParkToUserCheckIn = this.ParkLst;

    }
  }
  dummyParkData() {
    let data = [];
    for (var i = 0; i < 20; i++) {
      //data.push(
      //  {
      //    "position": {
      //      "lat": this.ParkLst[i].latLng.lat(),
      //      "lng": this.ParkLst[i].latLng.lng()
      //    },
      //    // "title": this.ParkLst[i].NEIGHBORHANAME,
      //    "icon": {
      //      url: "assets/imgs/Parking.png",
      //      size: {
      //        width: 30,
      //        height: 30,
      //      }
      //    },
      //    customInfo: this.ParkLst[i]["id"]
      //  }
      //)
      let NewMarker = this.map.addMarkerSync({
        "position": {
          "lat": this.ParkLst[i].latLng.lat(),
          "lng": this.ParkLst[i].latLng.lng()
        },
        // "title": this.ParkLst[i].NEIGHBORHANAME,
        "icon": {
          url: "assets/imgs/Parking.png",
          size: {
            width: 30,
            height: 30,
          }
        },
        customInfo: this.ParkLst[i]["id"]

      });
      NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERParkClick(params, this, NewMarker))
    }
    return data;
  }
  MARKERParkClick(params, _thisPage: HomePage, NewMarker) {

    let marker: Marker = <Marker>params[1];
    let Id: any = marker.get('customInfo');
    let obj = this.ParkLst.find(a => a.id == Id);
    _thisPage.DetailsAddressType = "Park";
    _thisPage.DetailsAddress = obj.PARCELNAME + " , " + obj.NEIGHBORHANAME + " , " + obj.MUNICIPALITYANAME;
    _thisPage.HideMainCard = true;
    _thisPage.HideDetailsCard = false;
    _thisPage.ZoomLatLng = { lat: obj.latd, lng: obj.lngd }
    _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);

    _thisPage.DivDetailsSrc = "assets/imgs/Parking.png";
    _thisPage.DivDetailsStyle = {
      'background-color': '#dcf0f5'
    };
    _thisPage.DivDetailsPargraph = "Parking";
    _thisPage.ParagraphDetailsStyle = {
      'color': '#2e8ea8'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + ","
      + this.CheckInLocation.lng + "/" + obj.latd + "," + obj.lngd;
    NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERParkClick(params, _thisPage, NewMarker))
  }
  addParkCluster(data) {
    //markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe

    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [

      ]
    });
    //.on(GoogleMapsEvent.MARKER_CLICK).
       markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
      let marker: Marker = <Marker>params[1];
      let Id: any = marker.get('customInfo');

      let obj = this.ParkLst.find(a => a.id == Id);
      this.DetailsAddressType = "Park";
      this.DetailsAddress = obj.PARCELNAME + " , " + obj.NEIGHBORHANAME + " , " + obj.MUNICIPALITYANAME;
      this.HideMainCard = true;
      this.HideDetailsCard = false;
      this.ZoomLatLng = { lat: obj.latd, lng: obj.lngd }
      this.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);

      this.DivDetailsSrc = "assets/imgs/Parking.png";
      this.DivDetailsStyle = {
        'background-color': '#dcf0f5'
      };
      this.DivDetailsPargraph = "Parking";
      this.ParagraphDetailsStyle = {
        'color': '#2e8ea8'
      };
       });
   // markerCluster.on(GoogleMapsEvent.MARKER_CLICK).ti

  }
  DrawUserChecks() {

      let limit = Number.MAX_SAFE_INTEGER;
    let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=22f99ccd-6358-4b81-afc9-08291f5caf45&limit=" + limit;
      let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
      let Roption = new RequestOptions({ 'headers': header });
      this.http.get(Url, Roption)
        .subscribe(response => {

          let res = response.json();
          var result = res.result.records;
          if (result != undefined && result.length > 0) {
            if (result.length > 0) {
              this.ATMParkUserCkecksLST = result;
              this.FormateUserChecksData();
            }
          }
        }, function (e) {
          console.log("error", e)
        })
    }
  FormateUserChecksData() {
    if (this.ATMParkUserCkecksLST.length > 0) {
      for (var i = 0; i < this.ATMParkUserCkecksLST.length; i++) {
        let latLng = new google.maps.LatLng(this.ATMParkUserCkecksLST[i].LAT, this.ATMParkUserCkecksLST[i].lNG);

        let dist = this.computeDistanceBetweenLanLng(this.Point, latLng);
        this.ATMParkUserCkecksLST[i].Distance = dist;
        this.ATMParkUserCkecksLST[i].latLng = latLng;
      }
      this.ATMParkUserCkecksLST.sort((a, b) => a.Distance - b.Distance);
      //this.addUserChecksCluster(this.dummyUserChecksData());
      this.dummyUserChecksData();

      if (this.MapLocLoad == true)
        this.ATMParkUserToCheckIn = this.ATMParkUserCkecksLST;
    }
  }
  dummyUserChecksData() {
    let d = [];

    for (var i = 0; i < this.ATMParkUserCkecksLST.length; i++) {
      let imgURL = "";
      if (this.ATMParkUserCkecksLST[i].TYPE == "ATM")
        imgURL = "assets/imgs/UserATM.png";
      else
        imgURL = "assets/imgs/UserPark.png";
      //d.push(
      //  {
      //    "position": {
      //      "lat": this.ATMParkUserCkecksLST[i].LAT,
      //      "lng": this.ATMParkUserCkecksLST[i].lNG
      //    },
      //    "icon": {
      //      url: imgURL,
      //      size: {
      //        width: 30,
      //        height: 30,
      //      }
      //    },
      //    customInfo: this.ATMParkUserCkecksLST[i]["id"]
      //  }
      //)
      let NewMarker = this.map.addMarkerSync({
        "position": {
          "lat": this.ATMParkUserCkecksLST[i].LAT,
          "lng": this.ATMParkUserCkecksLST[i].lNG
        },
        "icon": {
          url: imgURL,
          size: {
            width: 30,
            height: 30,
          }
        },
        customInfo: this.ATMParkUserCkecksLST[i]["id"]
      });
      NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERUserChecksClick(params, this, NewMarker))
    }
  }
  MARKERUserChecksClick(params, _thisPage: HomePage, NewMarker) {

    let marker: Marker = <Marker>params[1];
    let Id: any = marker.get('customInfo');

    let obj = this.ATMParkUserCkecksLST.find(a => a.id == Id);
    _thisPage.DetailsAddressType = "User" + obj.TYPE;
    _thisPage.DetailsAddress = obj.NAME;
    _thisPage.HideMainCard = true;
    _thisPage.HideDetailsCard = false;
    _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
    _thisPage.ZoomLatLng = { lat: obj.LAT, lng: obj.lNG };

    if (obj.TYPE == "ATM") {
      _thisPage.DivDetailsSrc = "assets/imgs/UserATM.png";
      _thisPage.DivDetailsStyle = {
        'background-color': '#ffdac1'
      };
      _thisPage.DivDetailsPargraph = "ATM Added By User";
    }
    else {
      _thisPage.DivDetailsSrc = "assets/imgs/UserPark.png";
      _thisPage.DivDetailsStyle = {
        'background-color': '#ffdac1'
      };
      _thisPage.DivDetailsPargraph = "Parking Added By User";
    }
    _thisPage.ParagraphDetailsStyle = {
      'color': '#ff6600'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + ","
      + this.CheckInLocation.lng + "/" + obj.LAT + "," + obj.lNG ;

    NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERUserChecksClick(params, _thisPage, NewMarker))
  }
  addUserChecksCluster(data) {
    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [

      ]
    });
    markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
      let marker: Marker = <Marker>params[1];
      let Id: any = marker.get('customInfo');

      let obj = this.ATMParkUserCkecksLST.find(a => a.id == Id);
      this.DetailsAddressType = "User"+obj.TYPE;
      this.DetailsAddress = obj.NAME;
      this.HideMainCard = true;
      this.HideDetailsCard = false;
      this.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
      this.ZoomLatLng = { lat: obj.LAT, lng: obj.lNG };

      if (obj.TYPE == "ATM") {
        this.DivDetailsSrc = "assets/imgs/UserATM.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = "ATM Added By User";
      }
      else {
        this.DivDetailsSrc = "assets/imgs/UserPark.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = "Parking Added By User";
      }
      this.ParagraphDetailsStyle = {
        'color': '#ff6600'
      };
     
     
    });
  }
  DisplayDetails() {

    this.dataDetails = [];
    if (this.ATMSLst.length > 0)
      this.dataDetails.push({
        Distance: this.ATMSLst[0].Distance,
        Name: this.ATMSLst[0]["الموقع"],
        type: 1,
        lat: this.ATMSLst[0]["Y GIS Coordinates"],
        lng: this.ATMSLst[0]["X GIS Coordinates"]
      })

    if (this.ParkLst.length > 0)
      this.dataDetails.push({
        Distance: this.ParkLst[0].Distance,
        Name: this.ParkLst[0].NEIGHBORHANAME,
        type: 2,
        lat: this.ParkLst[0].latd,
        lng: this.ParkLst[0].lngd
      })

    this.overlayHidden = false;

  }
  UserCheckIn() {
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      Lat: this.CheckInLocation.lat,
      Lng: this.CheckInLocation.lng,
      CreationTime: new Date()
    }];
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "d22f5e76-e53c-47b2-ac9c-dc6f3dc82fdc",
      records: data
    };

    // let url = "http://mwteam-001-site29.ftempurl.com/home/checkIn";
    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {

        let Message = "";
        if (response.status == 200)
          Message = "Ckeck In Successfully";
        else
          Message = "Error While Check In";
        let method = this.alerCtrl.create({
          message: Message,
          buttons: [
            {
              text: 'Ok',
              cssClass: 'method-color',
              handler: () => {
                console.log('Group clicked');
              }
            }
          ]
        });
        method.present()
      }
        , function (e) {
          console.log("error", e)
        })
  }
  //DivDetailsStyle() {
  //  return {
  //    'background-color': '#dcf0f5'
  //  };
  //}
  hideOverlay() {
    this.overlayHidden = true;
  }
  //PlaceClick(type) {

  //  let target: any;
  //  if (type == 1 && this.dataDetails.length > 0)
  //    target = { lat: this.dataDetails[0].lat, lng: this.dataDetails[0].lng }
  //  else if (type == 2 && this.dataDetails.length > 1)
  //    target = { lat: this.dataDetails[1].lat, lng: this.dataDetails[1].lng }
  //  this.overlayHidden = true;
  //  let position: CameraPosition<any> = {
  //    target: target,
  //    zoom: 18
  //  }
  //  this.map.moveCamera(position);
  //}
  ResetLocation() {
    let position: CameraPosition<any> = {
      target: this.CheckInLocation,
    }
    this.map.moveCamera(position);
    this.autocomplete.input = this.CurrentAddress;
  }
  BackToMainCard() {
    this.HideMainCard = false;
    this.HideDetailsCard = true;
    this.HideCheckSuccessCard = true;
    this.flage = true;
  }
  BackToMapPage() {
   
    this.HideMapPage = false;
    this.HideMainCard = false;
    this.HideCheckInPage = true;
    this.HideAboutPage = true;
   
    this.HideDetailsCard = true;
   
  }
  ZoomPlace() {
   // this.navCtrl.
    //let position: CameraPosition<any> = {
    //  target: this.ZoomLatLng,
    //  zoom: 18
    //}
    //this.map.moveCamera(position);
  }
  CheckIn() {
    this.HideMapPage = true;
    this.HideCheckInPage = false;
    this.HideAboutPage = true;
  }
  getClosestATMToMyLoc() {
    if (this.ATMToUserCheckIn.length > 0) {
      //this.ATMToUserCheckIn[i].length
      for (var i = 0; i < 5; i++) {
        // if (this.ATMToUserCheckIn[i].Distance < 50) {
        this.NearByCheckIn.push({
          value: {
            id: this.ATMToUserCheckIn[i].id,
            type: "ATM",
          },
          label: this.ATMToUserCheckIn[i]['الموقع'] + " , " + this.ATMToUserCheckIn[i]['City Arabic'],
          type: "ATM",
          Distance: this.ATMToUserCheckIn[i].Distance,
          lat: this.ATMToUserCheckIn[i]["Y GIS Coordinates"],
          lng: this.ATMToUserCheckIn[i]["X GIS Coordinates"],
          checkin_count: this.ATMToUserCheckIn[i].checkin_count
        })
        //}
        //else
        //  break;
      }
    }
  }
  getClosestUSERCheckInToMyLoc(PlaceType) {
    let newFilteredLST = this.ATMParkUserToCheckIn;

    if (PlaceType == "ATM")
      newFilteredLST = this.ATMParkUserToCheckIn.filter(function (i) { return i.TYPE == "ATM" });

    else if (PlaceType == "Park")
      newFilteredLST = this.ATMParkUserToCheckIn.filter(function (i) { return i.TYPE == "Park" });

    if (newFilteredLST.length > 0) {
      //this.newFilteredLST[i].length
      for (var i = 0; i < 5; i++) {
        if (newFilteredLST[i] != null) {
        this.NearByCheckIn.push({
          value: {
            id: newFilteredLST[i].id,
            type: "USER" + newFilteredLST[i].TYPE,
          },
          label: newFilteredLST[i].NAME,
          type: "USER" + newFilteredLST[i].TYPE,
          Distance: newFilteredLST[i].Distance,
          lat: newFilteredLST[i].LAT,
          lng: newFilteredLST[i].lNG,
          checkin_count: newFilteredLST[i].checkin_count
        })
        }
       // else
       //break;
      }
    }
  }
  getClosestParkToMyLoc() {
    if (this.ParkToUserCheckIn.length > 0) {
      //this.ParkToUserCheckIn.length
      for (var i = 0; i < 5; i++) {
        //if (this.ParkToUserCheckIn[i].Distance < 50) {
        this.NearByCheckIn.push({
          value: {
            id: this.ParkToUserCheckIn[i].id,
            type: "Park",
        },
          label: this.ParkToUserCheckIn[i].PARCELNAME + " , " + this.ParkToUserCheckIn[i].NEIGHBORHANAME + " , " + this.ParkToUserCheckIn[i].MUNICIPALITYANAME,
          type: "Park",
          Distance: this.ParkToUserCheckIn[i].Distance,
          lat: this.ParkToUserCheckIn[i].latd,
          lng: this.ParkToUserCheckIn[i].lngd,
          checkin_count: this.ParkToUserCheckIn[i].checkin_count
        })
        // }
        //else
        //  break;
      }
    }
  }
  DetailView(item) {
    this.DetailsAddressType = item.type;
    this.DetailsAddress = item.label;
    this.PlaceCheckInCount = (item.checkin_count == null ? 0 : item.checkin_count);
    //Show Map First
    this.HideCheckInPage = true;
    this.HideMapPage = false;
    this.HideMainCard = true;
    this.HideDetailsCard = false;
    this.ZoomLatLng = { lat: item.lat, lng: item.lng }
    if (item.type == "ATM") {
      this.DivDetailsSrc = "assets/imgs/ATM.png";
      this.DivDetailsStyle = {
        'background-color': '#d4f1e2'
      };
      this.DivDetailsPargraph = "ATM";
      this.ParagraphDetailsStyle = {
        'color': '#37a76f'
      };
    }
    else if (item.type == "Park") {
      this.DivDetailsSrc = "assets/imgs/Parking.png";
      this.DivDetailsStyle = {
        'background-color': '#dcf0f5'
      };
      this.DivDetailsPargraph = "Parking";
      this.ParagraphDetailsStyle = {
        'color': '#2e8ea8'
      };
    }
    else {
      if (item.type == "USERATM") {
        this.DivDetailsSrc = "assets/imgs/UserATM.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = "ATM Added By User";
      }
      else if (item.type == "USERPark") {
        this.DivDetailsSrc = "assets/imgs/UserPark.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = "Parking Added By User";
      }
      this.ParagraphDetailsStyle = {
        'color': '#ff6600'
      };
    }
  }
  changeInteraction(event) {
    this.PlaceId = 0;
    if (this.placeIdRequire == true)
      this.placeIdRequire = false;
    if (this.PointTypeIdRequire == true)
      this.PointTypeIdRequire = false;
    this.NearByCheckIn = [];
    if (event.value == 1) { // All
      if (this.ATMSLst.length > 0)
        this.getClosestATMToMyLoc();

      if (this.ParkLst.length > 0)
        this.getClosestParkToMyLoc();

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("All");

      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);

    }
    else if (event.value == 2) {// Parking
      if (this.ParkLst.length > 0)
        this.getClosestParkToMyLoc();

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("Park");

      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);
    }
    else if (event.value == 3) {// ATM

      if (this.ATMSLst.length > 0)
        this.getClosestATMToMyLoc();

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("ATM");

      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);
    }
  }
  changePlace(item) {
      this.SelectedPlaceCheckIn = this.NearByCheckIn.find(a => a.value.id == item.value.id);
  }
  SaveCheckIn() {
    // in cass 1,2,3 we increment check in point of existing place
    if (this.InteractionId == 1 || this.InteractionId == 2 || this.InteractionId == 3) {
      if (this.PlaceId == null || this.PlaceId == 0) {
        this.placeIdRequire = true;
        return;
      }
      else {
        this.placeIdRequire = false;
        this.UpdateExistingLocation();
        // Save Check In
      }
    } else {// in cass new  we add new check in
      if (this.PointTypeId == null || this.PointTypeId == 0) {
        this.PointTypeIdRequire = true;
        return;
      }
      else { // Add Check in New point ====== USER CHECK IN
        this.PointTypeIdRequire = false;
        this.ADDNewLocation();
      }
    }
  }
  InsertCheckIn(LocationId,type) {
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      Lat: this.CheckInLocation.lat,
      Lng: this.CheckInLocation.lng,
      CreationTime: new Date(),
      type: type,//this.SelectedPlaceCheckIn.type,
      location_id: LocationId//this.SelectedPlaceCheckIn.value.id
    }];
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "9307b0a7-f734-48d9-84fc-2d2a7ddbfa8f",
      records: data
    };
    
    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200) {
          this.HideCheckInPage = true;
          this.HideMapPage = false;
          this.HideCheckSuccessCard = false;
          this.HideMainCard = true;
          this.HideDetailsCard = true;
        }
          
      }
        , function (e) {
          console.log("error", e)
        })
  }
  UpdateExistingLocation() {
    console.log(this.SelectedPlaceCheckIn);
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      checkin_count: (this.SelectedPlaceCheckIn.checkin_count == null ? 1 : Number.parseInt(this.SelectedPlaceCheckIn.checkin_count) + 1),
      id: this.SelectedPlaceCheckIn.value.id
    }];
    let ResourceId = "";
    if (this.SelectedPlaceCheckIn.type == "ATM") {
      ResourceId = "e21abc9c-8825-4d23-b0b4-8179e88d6667";
    } else if (this.SelectedPlaceCheckIn.type == "Park") {
      ResourceId = "78708537-8606-4c88-916c-734b1bf38c5d";

    } else if (this.SelectedPlaceCheckIn.type == "USERPark" || this.SelectedPlaceCheckIn.type == "USERATM") {
      ResourceId = "22f99ccd-6358-4b81-afc9-08291f5caf45";
    }
    let datastore = {
      method: "update",
      force: true,
      resource_id: ResourceId,
      records: data
    };

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200)
          this.InsertCheckIn(data[0].id, this.SelectedPlaceCheckIn.type);
      }
        , function (e) {
          console.log("error", e)
        })
  }
  ADDNewLocation() {
    ////////////// Add New Place Then Check In
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let Id = Math.random() * (new Date().getDay() + new Date().getMonth() + new Date().getFullYear() + new Date().getMinutes() + new Date().getMilliseconds())
    Id = Number.parseInt(Id.toString());
    let data = [{
      LAT: this.CheckInLocation.lat,
      lNG: this.CheckInLocation.lng,
      CREATION_TIME: new Date(),
      TYPE: this.PointTypeId.label,
      NAME: this.CurrentAddress,
      checkin_count: 1,
      id: Id 
    }];
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "22f99ccd-6358-4b81-afc9-08291f5caf45",
      records: data
    };

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";

    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200)
          this.InsertCheckIn(Id, "USER" + data[0].TYPE);
      }
        , function (e) {
          console.log("error", e)
      })
  }
}
