/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MerchantsMapComponent } from './merchants-map.component';
import { of } from 'rxjs';
import { MerchantService } from '../../services/merchant.service';
import VectorSource from 'ol/source/Vector';
import { getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { MAP_DEFAULTS } from '../../_constants/constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

jest.mock('ol', () => ({
	Map: jest.fn().mockImplementation(() => ({
		getSize: jest.fn(() => [800, 600]),
		getView: jest.fn(() => new MockView()),
		setZoom: jest.fn(),
		getCenter: jest.fn(),
		getZoom: jest.fn(),
		getZoomForResolution: jest.fn(),
		on: jest.fn(),
		addEventListener: () => {
			return;
		},
		removeEventListener: () => {
			return;
		}
	})),
	View: jest.fn().mockImplementation(() => new MockView()),
	Feature: jest.fn().mockImplementation((properties) => ({
		setStyle: jest.fn(),
		getGeometry: jest.fn(() => ({
			getCoordinates: jest.fn(() => [properties.longitude, properties.latitude])
		})),
		getId: jest.fn(() => properties.id),
		get: jest.fn((prop) => properties[prop])
	})),
	Point: jest.fn().mockImplementation(() => ({})),

	VectorSource: jest.fn().mockImplementation(() => ({
		addFeature: jest.fn(),
		getFeatures: jest.fn(() => []),
		getExtent: jest.fn(() => [0, 0, 400, 300])
	})),
	VectorLayer: jest.fn().mockImplementation(() => ({})),
	Overlay: jest.fn().mockImplementation(() => ({
		setPosition: jest.fn(),
		getElement: jest.fn(() => document.createElement('div'))
	})),
	fromLonLat: jest.fn((coords) => coords)
}));

jest.mock('ol/layer', () => ({
	Tile: jest.fn(() => [200, 150])
}));

jest.mock('ol/source/OSM', () => {
	return jest.fn().mockImplementation(() => ({
		addFeature: jest.fn(),
		getFeatures: jest.fn(() => []),
		getExtent: jest.fn(() => [0, 0, 400, 300])
	}));
});

jest.mock('ol/extent', () => ({
	getCenter: jest.fn(() => [200, 150]),
	createEmpty: jest.fn(),
	getHeight: jest.fn(),
	getWidth: jest.fn(),
	getTopLeft: jest.fn(),
	applyTransform: jest.fn()
}));

class MockView {
	private center: number[] = [0, 0];
	private zoom = 8;

	setCenter(center: number[]) {
		this.center = center;
	}

	setZoom(zoom: number) {
		this.zoom = zoom;
	}

	getCenter() {
		return this.center;
	}

	getZoom() {
		return this.zoom;
	}

	getZoomForResolution() {
		return this.zoom;
	}

	fit(extent: number[], options: { size: number[]; duration: number }) {
		return '';
	}
}

jest.mock('ol/extent', () => ({
	createOrUpdate: jest.fn((minX, minY, maxX, maxY) => [minX, minY, maxX, maxY]), // Mock implementation
	getCenter: jest.fn(() => [200, 150]),
	createEmpty: jest.fn(),
	getHeight: jest.fn(),
	getWidth: jest.fn(),
	getTopLeft: jest.fn(),
	applyTransform: jest.fn()
}));

class MockMerchantService {
	getAllMerchants() {
		return of([
			{
				latitude: 0,
				longitude: 0,
				companyName: 'Merchant A',
				kvk: '12345678',
				category: 'Food',
				address: 'Zandvoort',
				contactEmail: 'domain@example.com'
			}
		]);
	}

	getMerchantsByCategory(categoryId: number) {
		// Mocking data based on categoryId
		if (categoryId === 1) {
			return of([
				{
					latitude: 10,
					longitude: 20,
					companyName: 'Merchant B',
					kvk: '87654321',
					category: 'Electronics',
					address: 'Amsterdam',
					contactEmail: 'contact@example.com'
				}
			]);
		} else {
			return of([]);
		}
	}
}

describe('MerhcantsMapComponent', () => {
	let component: MerchantsMapComponent;
	let fixture: ComponentFixture<MerchantsMapComponent>;
	let mockMerchantService: MockMerchantService;
	let mockPopupCloser: HTMLElement;
	let mockOverlay: any;
	let mockTargetElement: HTMLElement;
	let mockPopupElement: HTMLElement;
	let mapElement: HTMLElement;
	let mockMap: any;
	let mockView: MockView;
	let mockFeature: {
		get: jest.Mock;
		getGeometry: jest.Mock;
	};
	let mockVectorSource: any;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MerchantsMapComponent],
			imports: [TranslateModule.forRoot(), MatIconModule],
			providers: [{ provide: MerchantService, useClass: MockMerchantService }, TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(MerchantsMapComponent);
		component = fixture.componentInstance;
		mockMerchantService = TestBed.inject(MerchantService) as unknown as MockMerchantService;

		fixture.detectChanges();

		mapElement = fixture.nativeElement.querySelector('#map');

		mockView = new MockView();
		mockMap = {
			setTarget: jest.fn(),
			addLayer: jest.fn(),
			getSize: jest.fn(() => [800, 600]),
			getView: jest.fn(() => mockView),
			addEventListener: () => {
				return;
			},
			removeEventListener: () => {
				return;
			}
		};

		(component as any).map = mockMap;

		mockVectorSource = {
			getExtent: jest.fn(() => [0, 0, 400, 300])
		};

		component['overlay'] = mockOverlay as any;
		jest.spyOn(mockMerchantService, 'getAllMerchants').mockReturnValue(of([]));

		(global as any).navigator.geolocation = {
			getCurrentPosition: jest.fn(),
			watchPosition: jest.fn(),
			clearWatch: jest.fn()
		};

		jest.mock('ol/source/Vector', () => ({
			default: jest.fn().mockImplementation(() => ({
				addFeature: jest.fn(),
				getFeatures: jest.fn(() => []),
				getExtent: jest.fn(() => [0, 0, 400, 300])
			}))
		}));
	});

	it('should create the component', () => {
		expect(component).toBeTruthy();
	});

	it('should set overlay position and display popup data when a feature is clicked', () => {
		mockPopupElement = document.createElement('div');
		mockPopupElement.innerHTML = `
      <div id="popup-title"></div>
      <div id="popup-category"></div>
      <div id="popup-address"></div>
      <a id="popup-link"></a>
      <div id="popup-link-container"></div>
    `;

		mockOverlay = {
			setPosition: jest.fn(),
			getElement: jest.fn().mockReturnValue(mockPopupElement)
		} as unknown as (typeof component)['overlay'];

		component['overlay'] = mockOverlay;

		mockMap = {
			on: jest.fn(),
			forEachFeatureAtPixel: jest.fn(),
			getEventPixel: jest.fn(),
			getTargetElement: jest.fn().mockReturnValue(document.createElement('div'))
		};

		component['map'] = mockMap;
		const mockEvent = { pixel: [100, 100] };

		mockFeature = {
			get: jest.fn(),
			getGeometry: jest.fn()
		};
		const mockData = [
			{
				id: '1',
				companyName: 'Merchant A',
				identifierNumber: '12345678',
				category: 'Food',
				latitude: 10,
				longitude: 20,
				address: 'Address A',
				contactEmail: 'domain@example.com',
				website: 'http://example.com'
			}
		];

		component['data'] = mockData;
		mockFeature.get.mockReturnValue('1');
		mockFeature.getGeometry.mockReturnValue({
			getCoordinates: jest.fn().mockReturnValue([20, 10])
		});

		mockMap.forEachFeatureAtPixel.mockImplementation((pixel: any, callback: any) => {
			callback(mockFeature);
		});

		component['mapOnPinClick'](mockData);

		const clickEventCallback = mockMap.on.mock.calls[0][1];

		clickEventCallback(mockEvent);

		expect(mockMap.forEachFeatureAtPixel).toHaveBeenCalledWith(mockEvent.pixel, expect.any(Function));
		expect(mockPopupElement.querySelector('#popup-title')!.textContent).toBe('Merchant A');
		expect(mockPopupElement.querySelector('#popup-category')!.textContent).toBe('Food');
		expect(mockPopupElement.querySelector('#popup-address')!.textContent).toBe('Address A');
		expect(mockPopupElement.querySelector('#popup-link')!.textContent).toBe('http://example.com');
	});

	it('should set overlay position to undefined if no feature is found', () => {
		mockPopupElement = document.createElement('div');
		mockPopupElement.innerHTML = `
      <div id="popup-title"></div>
      <div id="popup-category"></div>
      <div id="popup-address"></div>
      <a id="popup-link"></a>
      <div id="popup-link-container"></div>
    `;

		mockOverlay = {
			setPosition: jest.fn(),
			getElement: jest.fn().mockReturnValue(mockPopupElement)
		} as unknown as (typeof component)['overlay'];

		component['overlay'] = mockOverlay;

		mockMap = {
			on: jest.fn(),
			forEachFeatureAtPixel: jest.fn(),
			getEventPixel: jest.fn(),
			getTargetElement: jest.fn().mockReturnValue(document.createElement('div'))
		};

		component['map'] = mockMap;

		const mockEvent = { pixel: [100, 100] };
		const mockData = [
			{
				id: '1',
				companyName: 'Merchant A',
				identifierNumber: '12345678',
				category: 'Food',
				latitude: 10,
				longitude: 20,
				address: 'Address A',
				contactEmail: 'domain@example.com',
				website: 'http://example.com'
			}
		];

		component['data'] = mockData;
		component['mapOnPinClick'](mockData);

		const clickEventCallback = mockMap.on.mock.calls[0][1];

		clickEventCallback(mockEvent);

		expect(mockMap.forEachFeatureAtPixel).toHaveBeenCalledWith(mockEvent.pixel, expect.any(Function));
		expect(mockOverlay.setPosition).toHaveBeenCalledWith(undefined);
	});

	it('should render the map element in the DOM', () => {
		expect(mapElement).toBeTruthy();
		expect(mapElement.tagName).toBe('DIV');
	});

	it('should remove the existing vector layer, add a new one, and update the map', () => {
		const vectorSourceMock = {
			addFeature: jest.fn(),
			getFeatures: jest.fn(() => []),
			getExtent: jest.fn(() => [0, 0, 400, 300])
		};

		jest.spyOn(component as any, 'addVectorLayerToMap').mockReturnValue(vectorSourceMock);

		const handleEmptyDataCaseSpy = jest.spyOn(component as any, 'handleEmptyDataCase').mockReturnValue(false);
		const mapOnPinClickSpy = jest.spyOn(component as any, 'mapOnPinClick');
		const calculateCenterAndZoomSpy = jest.spyOn(component as any, 'calculateCenterAndZoom');
		mockMap = {
			removeLayer: jest.fn(),
			addLayer: jest.fn(),
			on: jest.fn(),
			getSize: jest.fn(),
			getView: jest.fn(() => ({
				setCenter: jest.fn(),
				setZoom: jest.fn() 
			})) 
		};
		
		component.map = mockMap;
		component["data"] = [
			{
				latitude: 10,
				longitude: 20,
				companyName: 'Merchant B',
				identifierNumber: '87654321',
				category: 'Electronics',
				address: 'Amsterdam',
				contactEmail: 'contact@example.com'
			}
		];

		component['updateMapAfterDataFetch']();

		expect(handleEmptyDataCaseSpy).toHaveBeenCalled();
		expect(calculateCenterAndZoomSpy).toHaveBeenCalledWith(vectorSourceMock);
	});

	it('should call initializeMap with data', () => {
		const initializeMapSpy = jest.spyOn(component as any, 'initializeMap');
		component.ngOnInit();
		expect(initializeMapSpy).toHaveBeenCalled();
	});

	it('should calculate zoom level correctly when map size is defined', () => {
		mockMap.getSize = jest.fn(() => [800, 600]);
		mockView.getZoomForResolution = jest.fn(() => 10) as any;

		const extent = [0, 0, 400, 300];
		const zoomLevel = (component as any).calculateZoomLevel(extent);

		expect(mockView.getZoomForResolution).toHaveBeenCalledWith(
			Math.max((extent[2] - extent[0]) / 800, (extent[3] - extent[1]) / 600)
		);
		expect(zoomLevel).toBe(9);
	});

	it('should return default zoom level when map size is undefined', () => {
		mockMap.getSize = jest.fn(() => undefined);

		const extent = [0, 0, 400, 300];
		const zoomLevel = (component as any).calculateZoomLevel(extent);

		expect(zoomLevel).toBe(8);
	});

	it('should call initializeSuppliersData on ngOnInit', () => {
		const initializeSuppliersDataSpy = jest.spyOn(component as any, 'initializeSuppliersData');

		component.ngOnInit();

		expect(initializeSuppliersDataSpy).toHaveBeenCalled();
	});

	it('should create a vector source with features from data', () => {
		const vectorSourceMock = {
			addFeature: jest.fn(),
			getFeatures: jest.fn(() => []),
			getExtent: jest.fn(() => [0, 0, 400, 300])
		};
		jest.spyOn(VectorSource.prototype, 'addFeature').mockImplementation(vectorSourceMock.addFeature);
		jest.spyOn(VectorSource.prototype, 'getFeatures').mockImplementation(vectorSourceMock.getFeatures);
		jest.spyOn(VectorSource.prototype, 'getExtent').mockImplementation(vectorSourceMock.getExtent);

		const data = [
			{
				id: '10',
				latitude: 10,
				longitude: 10,
				companyName: 'Merchant B',
				identifierNumber: '12345678',
				category: 'Food',
				address: 'Zandvoort',
				contactEmail: 'domain@example.com'
			}
		];

		component['createVectorSource'](data);

		expect(vectorSourceMock.addFeature).toHaveBeenCalled();
	});

	it('should create a vector source with features from data', () => {
		const data = [
			{
				id: '20',
				latitude: 10,
				longitude: 10,
				companyName: 'Merchant B',
				identifierNumber: '12345678',
				category: 'Food',
				address: 'Zandvoort',
				contactEmail: 'domain@example.com'
			}
		];

		const vectorSource = component['createVectorSource'](data);

		expect(vectorSource).toBeTruthy();
	});

	it('should initialize the map with suppliers data', () => {
		const mockData = [
			{
				id: '10',
				latitude: 10,
				longitude: 10,
				companyName: 'Merchant A',
				kvk: '12345678',
				category: 'Food',
				address: 'Zandvoort',
				contactEmail: 'domain@example.com'
			}
		];

		jest.spyOn(mockMerchantService, 'getAllMerchants').mockReturnValue(of(mockData));

		const initializeMapSpy = jest.spyOn(component as any, 'initializeMap');

		component.ngOnInit();

		expect(initializeMapSpy).toHaveBeenCalled();
		expect(component.map).not.toBeNull();
	});

	it('should return calculated zoom level when map size is defined', () => {
		mockMap.getSize.mockReturnValue([800, 600]);
		component.map = mockMap;

		const extent = [0, 0, 400, 300];
		const zoomLevel = component['calculateZoomLevel'](extent);

		expect(mockMap.getSize).toHaveBeenCalled();

		expect(zoomLevel).toBe(7);
	});

	it('should return default zoom level when map size is undefined', () => {
		component.map = undefined as any;

		const extent = [0, 0, 400, 300];
		const zoomLevel = component['calculateZoomLevel'](extent);

		expect(zoomLevel).toBe(8);
	});

	it('should return 8 when getZoomForResolution returns undefined', () => {
		mockMap.getSize.mockReturnValue([800, 600]);
		mockView.getZoomForResolution = () => undefined as any;

		component.map = mockMap;

		const extent = [0, 0, 400, 300];
		const zoomLevel = component['calculateZoomLevel'](extent);

		expect(mockMap.getSize).toHaveBeenCalled();

		expect(zoomLevel).toBe(8);
	});

	describe('Geolocation', () => {
		let mockGeolocation: any;

		beforeEach(() => {
			mockGeolocation = {
				getCurrentPosition: jest.fn(),
				watchPosition: jest.fn(),
				clearWatch: jest.fn()
			};

			jest.spyOn(navigator.geolocation, 'getCurrentPosition');
		});

		it('should call navigator.geolocation.getCurrentPosition when setUserLocationAsDefault is called', () => {
			(component as any).setUserLocationAsDefault();
			expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
		});

		it('should handle geolocation success correctly', () => {
			const mockPosition = {
				coords: {
					longitude: 30,
					latitude: 50
				}
			};

			const handleGeolocationSuccessSpy = jest.spyOn(component as any, 'handleGeolocationSuccess');

			component['setUserLocationAsDefault']();
			const getCurrentPositionCallback = (navigator.geolocation.getCurrentPosition as jest.Mock).mock.calls[0][0];
			getCurrentPositionCallback(mockPosition);

			expect(handleGeolocationSuccessSpy).toHaveBeenCalledWith(mockPosition);
			expect(component.showEmptyState).toBe(false);
		});

		it('should handle geolocation success correctly', () => {
			const mockPosition: GeolocationPosition = {
				coords: {
					longitude: 30,
					latitude: 50,
					accuracy: 0,
					altitude: null,
					altitudeAccuracy: null,
					heading: null,
					speed: null
				},
				timestamp: Date.now()
			};

			const expectedCenter = getCenter(
				transformExtent(
					[
						mockPosition.coords.longitude - MAP_DEFAULTS.DEFAULT_RADIUS / MAP_DEFAULTS.METERS_PER_DEGREE,
						mockPosition.coords.latitude - MAP_DEFAULTS.DEFAULT_RADIUS / MAP_DEFAULTS.METERS_PER_DEGREE,
						mockPosition.coords.longitude + MAP_DEFAULTS.DEFAULT_RADIUS / MAP_DEFAULTS.METERS_PER_DEGREE,
						mockPosition.coords.latitude + MAP_DEFAULTS.DEFAULT_RADIUS / MAP_DEFAULTS.METERS_PER_DEGREE
					],
					MAP_DEFAULTS.COORDINATE_SYSTEMS.GEOGRAPHIC,
					MAP_DEFAULTS.COORDINATE_SYSTEMS.WEB_MERCATOR
				)
			);

			const handleGeolocationSuccessSpy = jest.spyOn(component as any, 'handleGeolocationSuccess');

			component['setUserLocationAsDefault']();
			const getCurrentPositionCallback = (navigator.geolocation.getCurrentPosition as jest.Mock).mock.calls[0][0];
			getCurrentPositionCallback(mockPosition);

			expect(handleGeolocationSuccessSpy).toHaveBeenCalledWith(mockPosition);
		});
	});

	describe('Geolocation absence', () => {
		beforeEach(() => {
			(global as any).originalGeolocation = navigator.geolocation;

			(global as any).navigator.geolocation = undefined;
		});

		afterEach(() => {
			(global as any).navigator.geolocation = (global as any).originalGeolocation;
		});

		it('should return early if navigator.geolocation is not available', () => {
			const setUserLocationAsDefaultSpy = jest.spyOn(component as any, 'setUserLocationAsDefault');

			component['setUserLocationAsDefault']();

			expect(setUserLocationAsDefaultSpy).toHaveBeenCalled();
			expect(navigator.geolocation).toBeUndefined();
		});
	});

	describe('Geolocation Error Handling', () => {
		let mockGeolocation: any;

		beforeEach(() => {
			mockGeolocation = {
				getCurrentPosition: jest.fn(),
				watchPosition: jest.fn(),
				clearWatch: jest.fn()
			};

			jest.spyOn(navigator.geolocation, 'getCurrentPosition');
		});

		it('should set showEmptyState to true when geolocation fails', () => {
			(component as any).setUserLocationAsDefault();
			const getCurrentPositionErrorCallback = (navigator.geolocation.getCurrentPosition as jest.Mock).mock
				.calls[0][1];

			getCurrentPositionErrorCallback();

			expect(component.showEmptyState).toBe(true);
		});
	});

	it('should set overlay position to undefined and blur the popup closer on click', () => {
		mockOverlay = { setPosition: jest.fn() };
		component['overlay'] = mockOverlay as any;

		mockPopupCloser = document.createElement('button');
		mockPopupCloser.id = 'popup-closer';
		jest.spyOn(document, 'getElementById').mockReturnValue(mockPopupCloser);
		mockPopupCloser.blur = jest.fn();

		component['onClose']();

		mockPopupCloser.click();

		expect(mockOverlay.setPosition).toHaveBeenCalledWith(undefined);
		expect(mockPopupCloser.blur).toHaveBeenCalled();
	});

	it('should change the cursor to pointer if a feature is hit, or reset it otherwise', () => {
		mockTargetElement = document.createElement('div');

		mockMap = {
			on: jest.fn(),
			getEventPixel: jest.fn(),
			hasFeatureAtPixel: jest.fn(),
			getTargetElement: jest.fn().mockReturnValue(mockTargetElement)
		};

		component['map'] = mockMap as any;
		const mockEvent = {
			originalEvent: {} as MouseEvent
		};
		const mockPixel = [100, 100];
		const mockHasFeature = true;

		mockMap.getEventPixel.mockReturnValue(mockPixel);
		mockMap.hasFeatureAtPixel.mockReturnValue(mockHasFeature);

		component['mapPointerMove']();

		const eventListenerCallback = mockMap.on.mock.calls[0][1];

		eventListenerCallback(mockEvent);

		expect(mockMap.getEventPixel).toHaveBeenCalledWith(mockEvent.originalEvent);
		expect(mockMap.hasFeatureAtPixel).toHaveBeenCalledWith(mockPixel);
		expect(mockTargetElement.style.cursor).toBe('pointer');

		mockMap.hasFeatureAtPixel.mockReturnValue(false);
		eventListenerCallback(mockEvent);

		expect(mockTargetElement.style.cursor).toBe('');
	});

	it('should set overlay position to undefined and call fetchMerchantDataByCategory', () => {
		const fetchMerchantDataByCategorySpy = jest.spyOn(component as any, 'fetchMerchantDataByCategory');
		mockOverlay = {
			setPosition: jest.fn(),
			getElement: jest.fn().mockReturnValue(mockPopupElement)
		} as unknown as (typeof component)['overlay'];
		component.filterMerchantsByCategory(1);

		expect(fetchMerchantDataByCategorySpy).toHaveBeenCalledWith(1);
	});

	it('should add a new vector layer to the map', () => {
		const vectorSourceMock = {
			addFeature: jest.fn(),
			getFeatures: jest.fn(() => []),
			getExtent: jest.fn(() => [0, 0, 400, 300])
		};
		jest.spyOn(VectorSource.prototype, 'addFeature').mockImplementation(vectorSourceMock.addFeature);
		jest.spyOn(VectorSource.prototype, 'getFeatures').mockImplementation(vectorSourceMock.getFeatures);
		jest.spyOn(VectorSource.prototype, 'getExtent').mockImplementation(vectorSourceMock.getExtent);

		component["data"] = [
			{
				latitude: 10,
				longitude: 20,
				companyName: 'Merchant B',
				identifierNumber: '87654321',
				category: 'Electronics',
				address: 'Amsterdam',
				contactEmail: 'contact@example.com'
			}
		];

		const result = component['addVectorLayerToMap']();

		expect(result).toBeTruthy();
		expect(mockMap.addLayer).toHaveBeenCalled();
	});

});
