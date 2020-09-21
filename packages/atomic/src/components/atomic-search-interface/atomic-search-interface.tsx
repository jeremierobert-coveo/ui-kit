import {
  Component,
  Prop,
  h,
  Listen,
  Method,
  Watch,
  Element,
} from '@stencil/core';
import {
  HeadlessEngine,
  searchPageReducers,
  Engine,
  SearchActions,
  HeadlessConfigurationOptions,
  AnalyticsActions,
  ConfigurationActions,
} from '@coveo/headless';
import {RenderError} from '../../utils/render-utils';
import {InitializeEvent} from '../../utils/initialization-utils';

@Component({
  tag: 'atomic-search-interface',
  shadow: true,
})
export class AtomicSearchInterface {
  @Element() host!: HTMLDivElement;
  @Prop() sample = false;
  @Prop({reflect: true}) pipeline = 'default';
  @Prop({reflect: true}) searchHub = 'default';
  @RenderError() error?: Error;

  private engine?: Engine;
  private hangingComponentsInitialization: InitializeEvent[] = [];
  private initialized = false;

  constructor() {
    if (this.sample) {
      this.initialize(HeadlessEngine.getSampleConfiguration());
    }
  }

  @Method() async initialize(
    options: Pick<
      HeadlessConfigurationOptions,
      'accessToken' | 'organizationId' | 'renewAccessToken' | 'platformUrl'
    >
  ) {
    if (this.initialized) {
      console.error(
        'The atomic-search-interface component has already been initialized.',
        this.host,
        this
      );
      return;
    }

    this.initEngine({
      ...options,
      search: {
        searchHub: this.searchHub,
        pipeline: this.pipeline,
      },
    });

    this.initialized = true;
  }

  private initEngine(config: HeadlessConfigurationOptions) {
    this.engine = new HeadlessEngine({
      configuration: config,
      reducers: searchPageReducers,
    });

    this.hangingComponentsInitialization.forEach((event) =>
      event.detail(this.engine!)
    );

    this.hangingComponentsInitialization = [];

    this.engine!.dispatch(
      SearchActions.executeSearch(AnalyticsActions.logInterfaceLoad())
    );
  }

  @Watch('searchHub')
  @Watch('pipeline')
  updateSearchConfiguration() {
    this.engine?.dispatch(
      ConfigurationActions.updateSearchConfiguration({
        pipeline: this.pipeline,
        searchHub: this.searchHub,
      })
    );
  }

  @Listen('atomic/initializeComponent')
  public handleInitialization(event: InitializeEvent) {
    event.stopPropagation();

    if (this.engine) {
      event.detail(this.engine);
      return;
    }

    this.hangingComponentsInitialization.push(event);
  }

  public render() {
    return <slot></slot>;
  }
}