import { Component, h, Prop, State, Element, Listen } from "@stencil/core";
import Swave from "swave";

@Component({
  tag: "swave-player",
  styleUrl: "swave-player.scss"
})
export class SwavePlayer {
  @Prop() audioUrl: string;
  @Prop() captionUrl: string;
  @Prop() audioTitle: string;
  @State() private plays = false;
  @State() private currentTime;
  @State() private totalTime;
  @State() private muted: boolean = false;
  @State() private currentVolume: number = 0.5;
  @State() private currentCaption: string = null;
  @State() private showCaptions: boolean = false;
  @Element() private element: HTMLElement;
  private swave: any;
  private captureMouse: boolean = false;

  componentWillLoad() {
    this.swave = new Swave({ audioUrl: this.audioUrl, captionUrl: this.captionUrl });
    this.swave.disableVisualization();

    this.swave.getDuration().then(duration => {
      this.totalTime = duration;
    })

    this.swave.subscribeToOnTimeUpdate((data) => {
      this.currentTime = data.currentTime;
      if (data.captions && data.captions.text && this.showCaptions) {
        this.currentCaption = data.captions.text;
      } else {
        this.currentCaption = null;
      }

    })
  }

  componentDidLoad() {
    this.swave.enableVisualization(this.element.querySelector(".canvas"));
  }

  @Listen('resize', { target: 'window' })
  handleResize() {
    this.swave.disableVisualization();
    this.swave.enableVisualization(this.element.querySelector(".canvas"));
  }

  play() {
    this.swave.play();
  }

  stop() {
    this.swave.stop();
  }

  pause() {
    this.swave.pause();
  }

  setProgress(e) {
    let rect = e.currentTarget.getBoundingClientRect(); // always gets the target that the event is set on
    let x = e.clientX - rect.left; //x position within the element.
    let xPercent = (x / rect.width) * 100;
    let newCurrentTime = this.totalTime * xPercent / 100;
    this.swave.setCurrentTime(newCurrentTime);
  }

  setVolume(e) {
    if(this.captureMouse) {
      let rect = e.currentTarget.getBoundingClientRect(); // always gets the target that the event is set on
      let y = e.clientY - rect.top; //x position within the element.
      let yPercent = (y / rect.height) * 100;
      let newVolume = (yPercent / 100) > 1 ? null : yPercent / 100;

      if (newVolume && newVolume > 0) {
        this.muted = false;
        this.currentVolume = newVolume !== 1 ? 1 - newVolume : 1;
        this.swave.setVolume(this.currentVolume);
      }
    }
  }

  fastForward() {
    if (this.currentTime < this.totalTime) {
      this.swave.setCurrentTime(this.currentTime + 1);
    }
  }

  fastBackward() {
    if (this.currentTime > 0) {
      this.swave.setCurrentTime(this.currentTime - 1);
    }
  }

  togglePlay() {
    this.plays = !this.plays;
    this.plays ? this.play() : this.pause();
    this.currentCaption = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.swave.gainNode.gain.value = this.muted ? 0 : this.currentVolume;
  }

  toggleCaptions() {
    this.showCaptions = !this.showCaptions;
  }

  render() {
    return <div class='swave-player'>
      <div class="thumbnail" style={{ backgroundImage: `url('https://placeimg.com/200/200/any')` }}>
        <div class="controls">
          <div class="fast-backward" onClick={() => this.fastBackward()}>
            <span></span><span></span>
          </div>
          <div class="play-stop" onClick={() => this.togglePlay()}>
            <span class={this.plays ? 'pause' : 'play'}></span>
          </div>
          <div class="fast-forward" onClick={() => this.fastForward()}>
            <span></span><span></span>
          </div>
        </div>
      </div>

      <div class="actions">
        <div class="canvas"></div>

        <div class="title">
          {this.audioTitle}
        </div>
        <div class="cc-wrapper">
          <div class={this.showCaptions ? 'cc-btn cc-btn-active' : 'cc-btn'} onClick={() => this.toggleCaptions()}>
            CC
          </div>
          <div class="cc-content">
            <span style={{ display: this.currentCaption ? 'inline' : 'none'}}>
              {this.currentCaption}
            </span>
          </div>
        </div>
        <div class="progress-wrapper">
          <div class="progress-bar" onClick={($event) => this.setProgress($event)}>
            <div class="inner-progress" style={{ width: (this.currentTime / this.totalTime) * 100 + '%' }}>
            </div>
          </div>
        </div>

        <div class="volume-wrapper">
          <div class="volume-bar"
            onMouseMove={($event) => this.setVolume($event)}
            onMouseDown={($event) => { this.captureMouse = true; this.setVolume($event);}}
            onMouseUp={() => { this.captureMouse = false }}
            onMouseLeave={() => { this.captureMouse = false }}>
            <div class="volume-inner" style={{ height: ((this.currentVolume / 1) * 100 + "%" )}}></div>
            <svg onClick={() => this.toggleMute()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{display: this.muted ? 'none' : 'block'}}>
              <path d="M5 17h-5v-10h5v10zm2-10v10l9 5v-20l-9 5zm17 4h-5v2h5v-2zm-1.584-6.232l-4.332 2.5 1 1.732 4.332-2.5-1-1.732zm1 12.732l-4.332-2.5-1 1.732 4.332 2.5 1-1.732z" />
            </svg>
            <svg onClick={() => this.toggleMute()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ display: !this.muted ? 'none' : 'block' }}>
              <path d="M22 1.269l-18.455 22.731-1.545-1.269 3.841-4.731h-1.827v-10h4.986v6.091l2.014-2.463v-3.628l5.365-2.981 4.076-5.019 1.545 1.269zm-10.986 15.926v.805l8.986 5v-16.873l-8.986 11.068z" />
            </svg>
          </div>
        </div>

      </div>
    </div>;
  }
}
