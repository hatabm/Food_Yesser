import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { FormsModule } from '@angular/forms';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { MarkerPage } from '../pages/marker/marker';
import { CirclePage } from '../pages/circle/circle';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { GoogleMaps } from "@ionic-native/google-maps";
import { HttpModule } from '@angular/http';
import { Diagnostic } from '@ionic-native/diagnostic';
import { IntroPage } from '../pages/introJs/intro';
import { ButtonModule } from 'primeng/components/button/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DropdownModule } from 'primeng/components/dropdown/dropdown';//'primeng/dropdown';
import { TieredMenuModule } from 'primeng/components/tieredmenu/tieredmenu';


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    IntroPage,
    MarkerPage,
    CirclePage,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    IonicModule.forRoot(MyApp),
    BrowserAnimationsModule,
    HttpModule,
    ButtonModule,
    DropdownModule,
   TieredMenuModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    IntroPage,
    MarkerPage,
    CirclePage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    GoogleMaps,
    Diagnostic,
   // Geolocation,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
