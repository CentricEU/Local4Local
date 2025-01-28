import { Feature, Map, MapBrowserEvent, Overlay, View } from 'ol';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { defaults as defaultControls } from 'ol/control';
import VectorSource from 'ol/source/Vector';
import { MAP_DEFAULTS } from '../../_constants/constants';
import { Tile } from 'ol/layer';
import { getCenter } from 'ol/extent';
import VectorLayer from 'ol/layer/Vector';
import { Geometry, Point } from 'ol/geom';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { MerchantService } from '../../services/merchant.service';
import { Coordinate } from 'ol/coordinate';
import { MerchantDto } from '../../models/merchant-dto.model';
import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FeatureLike } from 'ol/Feature';
import { CATEGORY_ICON_MAP } from '../../_constants/category-icon-constant';

@Component({
	selector: 'app-merchants-map',
	templateUrl: './merchants-map.component.html',
	styleUrl: './merchants-map.component.scss'
})
export class MerchantsMapComponent implements OnInit {
	@Input() public showCategories = true;
	@Output() emptyStateChange = new EventEmitter<boolean>();

	public readonly merchantService = inject(MerchantService);
	public readonly translateService = inject(TranslateService);
	public map: Map;
	public showEmptyState = false;

	private overlay!: Overlay;
	private data: MerchantDto[];
	private vectorLayer!: VectorLayer<Feature>;

	public ngOnInit(): void {
		this.initializeSuppliersData();
	}

	public filterMerchantsByCategory(categoryId: number): void {
		if (this.overlay) {
			this.overlay.setPosition(undefined);
		}
		this.fetchMerchantDataByCategory(categoryId);
	}

	private fetchMerchantDataByCategory(categoryId: number): void {
		this.merchantService.getMerchantsByCategory(categoryId).subscribe((data) => {
			this.data = data;
			this.updateMapAfterDataFetch();
		});
	}

	private updateMapAfterDataFetch(): void {
		this.map.removeLayer(this.vectorLayer);

		if (this.handleEmptyDataCase()) {
			return;
		}

		const vectorSource = this.addVectorLayerToMap();
		this.mapOnPinClick(this.data);
		this.calculateCenterAndZoom(vectorSource);
	}

	private addVectorLayerToMap(): VectorSource<Feature<Geometry>> {
		const vectorSource = this.createVectorSource(this.data);
		this.vectorLayer = new VectorLayer({
			source: vectorSource
		});
		this.map.addLayer(this.vectorLayer);

		return vectorSource;
	}

	private initializeSuppliersData(): void {
		this.merchantService.getAllMerchants().subscribe((data) => {
			this.data = data;
			this.initializeMap();
		});
	}

	private createMap(vectorLayer: VectorLayer<Feature>): void {
		if (this.map) {
			this.map.addLayer(vectorLayer);
			return;
		}

		this.createOverlay();

		this.map = new Map({
			layers: [new Tile({ source: new OSM() }), vectorLayer],
			target: 'map',
			view: new View({
				center: fromLonLat([0, 0]),
				zoom: MAP_DEFAULTS.ZOOM_LEVEL
			}),
			controls: defaultControls({
				zoom: false,
				attribution: true
			}),
			overlays: [this.overlay]
		});

		this.mapOnPinClick(this.data);
		this.onClose();
		this.mapPointerMove();
	}

	private createOverlay(): void {
		this.overlay = new Overlay({
			element: document.getElementById('popup') as HTMLElement,
			positioning: 'bottom-center',
			autoPan: true
		});
	}

	private onClose(): void {
		const popupCloser = document.getElementById('popup-closer') as HTMLElement;
		popupCloser.onclick = () => {
			this.overlay.setPosition(undefined);
			popupCloser.blur();
			return false;
		};
	}

	private mapOnPinClick(data: MerchantDto[]): void {
		if (this.mapClickListener) {
			this.map.un('click', this.mapClickListener);
		}

		this.mapClickListener = (event) => {
			let featureFound = false;

			this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
				if (feature.get('id')) {
					this.overlay.setPosition(this.getCoordonates(feature));

					const index = this.findIndexById(feature.get('id'));
					this.setPopupPinData(data[index]);
					featureFound = true;
				}
			});

			if (!featureFound) {
				this.overlay.setPosition(undefined);
			}
		};

		this.map.on('click', this.mapClickListener);
	}

	private mapClickListener: (event: MapBrowserEvent<UIEvent>) => void;

	private getCoordonates(feature: FeatureLike): Coordinate {
		const coordinates = feature.getGeometry() as Point;

		const [longitude, latitude] = toLonLat(coordinates.getCoordinates());

		return fromLonLat([longitude, latitude]);
	}

	private findIndexById(id: string): number {
		return this.data.findIndex((item) => item.id === id);
	}

	private setPopupPinData(data: MerchantDto): void {
		// Set the popup body text
		const element = this.overlay.getElement();

		const titleElement = element!.querySelector('#popup-title') as HTMLElement;
		const categoryElement = element!.querySelector('#popup-category') as HTMLElement;
		const addressElement = element!.querySelector('#popup-address') as HTMLElement;
		const linkElement = element!.querySelector('#popup-link') as HTMLAnchorElement;

		titleElement.textContent = data.companyName;
		categoryElement.textContent = this.translateService.instant(data.category as string);
		addressElement.textContent = data.address;
		const linkContainerElement = element!.querySelector('#popup-link-container') as HTMLElement;

		if (data.website) {
			linkContainerElement.style.display = 'flex';
			linkElement.href = data.website;
			linkElement.textContent = data.website;
			return;
		}

		linkContainerElement.style.display = 'none';
	}

	private mapPointerMove(): void {
		// Pointermove event listener to change cursor on hover
		this.map.on('pointermove', (event) => {
			const pixel = this.map.getEventPixel(event.originalEvent);
			const hit = this.map.hasFeatureAtPixel(pixel);
			this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
		});
	}

	private initializeMap(): void {
		if (this.handleEmptyDataCase()) {
			return;
		}

		const vectorSource = this.createVectorSource(this.data);

		if (this.vectorLayer) {
			this.vectorLayer.setSource(vectorSource);
		} else {
			this.vectorLayer = new VectorLayer({
				source: vectorSource
			});

			this.createMap(this.vectorLayer);
		}

		this.calculateCenterAndZoom(vectorSource);
	}

	private handleEmptyDataCase(): boolean {
		if (!this.data.length) {
			this.setUserLocationAsDefault();
			return true;
		}
		return false;
	}

	private setUserLocationAsDefault(): void {
		if (!navigator.geolocation) {
			this.showEmptyState = true;
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.handleGeolocationSuccess(position);
			},
			() => {
				this.emptyStateChange.emit(true);
				this.showEmptyState = true;
			}
		);
	}

	private handleGeolocationSuccess(position: GeolocationPosition): void {
		const userCoordinates = [position.coords.longitude, position.coords.latitude];

		const degreesRadius = MAP_DEFAULTS.DEFAULT_RADIUS / MAP_DEFAULTS.METERS_PER_DEGREE;

		const extent = transformExtent(
			[
				userCoordinates[0] - degreesRadius,
				userCoordinates[1] - degreesRadius,
				userCoordinates[0] + degreesRadius,
				userCoordinates[1] + degreesRadius
			],
			MAP_DEFAULTS.COORDINATE_SYSTEMS.GEOGRAPHIC,
			MAP_DEFAULTS.COORDINATE_SYSTEMS.WEB_MERCATOR
		);

		const center = getCenter(extent);
		const vectorSource = new VectorSource();

		this.createMap(new VectorLayer({ source: vectorSource }));
		this.map.getView().setCenter(center);
		this.map.getView().fit(extent, { duration: 1000 });
	}

	private createFeatureFromMerchant(merchant: MerchantDto, showCategories?: boolean): Feature {
		const iconSrc = showCategories
			? CATEGORY_ICON_MAP[merchant.category as number] || '/assets/images/map-marker.svg'
			: '/assets/images/map-marker.svg';

		const feature = new Feature({
			geometry: new Point(fromLonLat([merchant.longitude, merchant.latitude])),
			name: merchant.companyName,
			id: merchant.id
		});

		feature.setStyle(
			new Style({
				image: new Icon({
					src: iconSrc,
					scale: MAP_DEFAULTS.MARKER_SCALE
				})
			})
		);

		return feature;
	}

	private createVectorSource(data: MerchantDto[]): VectorSource {
		const vectorSource = new VectorSource();

		const features = data.map((entry) => this.createFeatureFromMerchant(entry, this.showCategories));

		features.forEach((feature) => vectorSource.addFeature(feature));

		return vectorSource;
	}

	private calculateCenterAndZoom(vectorSource: VectorSource): void {
		const extent = vectorSource.getExtent();
		const center = getCenter(extent);
		const features = vectorSource.getFeatures();

		const isSingleFeature = features.length === 1;
		const zoom = this.calculateZoomLevel(extent, isSingleFeature);

		const view = this.map.getView();
		view.setCenter(center);
		view.setZoom(zoom);
	}

	private calculateZoomLevel(extent: number[], isSingleState = false): number {
		const mapSize = this.map?.getSize();
		if (!mapSize || isSingleState) return MAP_DEFAULTS.ZOOM_LEVEL;

		const resolution = Math.max((extent[2] - extent[0]) / mapSize[0], (extent[3] - extent[1]) / mapSize[1]);
		const zoom = this.map.getView().getZoomForResolution(resolution);

		return zoom !== undefined ? zoom - 1 : MAP_DEFAULTS.ZOOM_LEVEL;
	}
}
