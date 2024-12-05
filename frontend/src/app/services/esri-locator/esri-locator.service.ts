import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { loadModules } from 'esri-loader';
import AddressCandidate from '@arcgis/core/rest/support/AddressCandidate';
import { EsriSuggestionResult } from '../../models/esri-suggestion-response.model';
import { environment } from '../../../environments/environment';
import Point from '@arcgis/core/geometry/Point';

type LocatorType = typeof import('@arcgis/core/rest/locator');

@Injectable({
    providedIn: 'root'
})
export class EsriLocatorService {
    private readonly defaultLocation = new Point({
        latitude: 52.08736758114364,
        longitude: 5.44922327866205,
        spatialReference: { wkid: 4326 }
    });

    private readonly locatorParams = {
        countryCode: environment.esriConfig.countryCode,
        maxLocations: 10
    };

    public get locatorURL(): string {
        return environment.esriConfig.locatorURL;
    }

    public getSuggestions(input: string): Observable<EsriSuggestionResult[]> {
        if (!input.trim()) {
            return of([]);
        }

        return this.loadLocatorAndPointModule().pipe(
            switchMap(([locator, Point]) => {
                const location = new Point({
                    latitude: 52.08736758114364,
                    longitude: 5.44922327866205,
                    spatialReference: { wkid: 4326 }
                });

                const params = {
                    ...this.locatorParams,
                    text: input,
                    location: location
                };

                return from(locator.suggestLocations(this.locatorURL, params)).pipe(
                    map((response) => response as EsriSuggestionResult[]),
                    catchError(this.handleError<EsriSuggestionResult[]>([]))
                );
            }),
            catchError(this.handleError<EsriSuggestionResult[]>([]))
        );
    }

    public findLocationBasedOnSuggestion(suggestion: EsriSuggestionResult): Observable<AddressCandidate[]> {
        return this.loadLocatorAndPointModule().pipe(
            switchMap(([locator, Point]) => {
                const location = new Point({
                    latitude: 52.08736758114364,
                    longitude: 5.44922327866205,
                    spatialReference: { wkid: 4326 }
                });

                const params = {
                    address: { SingleLine: suggestion.text },
                    ...this.locatorParams,
                    location,
                    forStorage: false,
                    magicKey: suggestion.magicKey
                };

                return from(locator.addressToLocations(this.locatorURL, params) as Promise<AddressCandidate[]>).pipe(
                    map((response: AddressCandidate[]) => response),
                    catchError(this.handleError<AddressCandidate[]>([]))
                );
            }),
            catchError(this.handleError<AddressCandidate[]>([]))
        );
    }

    private loadLocatorAndPointModule(): Observable<[LocatorType, typeof Point]> {
        return from(loadModules(['esri/rest/locator', 'esri/geometry/Point']) as Promise<[LocatorType, typeof Point]>);
    }

    private handleError<T>(result: T): () => Observable<T> {
        return () => of(result);
    }
}
