﻿/*---------------------------------------------------------------------
// <copyright file="TelemetryClient.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
 // <summary>
 //   Part of the Work Item Visualization VSO extension by the
 //     ALM Rangers. TelemetryClient.
 //  </summary>
//---------------------------------------------------------------------*/


export class TelemetryClient {

    private static Enabled: boolean = false;

    private static telemetryClient: TelemetryClient;
    public static getClient(): TelemetryClient {
        if (!this.telemetryClient) {
            this.telemetryClient = new TelemetryClient();
            if (TelemetryClient.Enabled) {
                this.telemetryClient.Init();
            }
        }

        return this.telemetryClient;
    }

    private appInsightsClient: Microsoft.ApplicationInsights.AppInsights;

    private Init() {
        try {
            var snippet: any = {
                config: {
                    instrumentationKey: "__INSTRUMENTATIONKEY__",//__INSTRUMENTATIONKEY__ = -afb9-bdb4395ca8ea
                }
            };
            var x = VSS.getExtensionContext();

            var init = new Microsoft.ApplicationInsights.Initialization(snippet);
            this.appInsightsClient = init.loadAppInsights();

            var webContext = VSS.getWebContext();
            this.appInsightsClient.setAuthenticatedUserContext(webContext.user.id, webContext.collection.id);
        }
        catch (e) {
            this.appInsightsClient = null;
            console.log(e);
        }
    }

    public startTrackPageView(name?: string) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.startTrackPage(name);
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public stopTrackPageView(name?: string) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.stopTrackPage(name);
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackPageView(name, url, properties, measurements, duration);        
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public trackEvent(name: string, properties?: Object, measurements?: Object) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackEvent(name, properties, measurements);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public trackException(exception: Error, handledAt?: string, properties?: Object, measurements?: Object) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackException(exception, handledAt, properties, measurements);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    public trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Object) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackMetric(name, average, sampleCount, min, max, properties);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    }

}