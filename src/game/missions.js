// Passenger missions: someone waves from the kerb → pick them up by driving in the lane
// beside them → reach the next landmark before the timer runs out for a fare.
import * as THREE from 'three';
import { box, cone, bake, pick, rand } from '../models/kit.js';
import { buildPerson } from '../models/passenger.js';
import { game, LANES } from './state.js';

const MISSION_SECONDS = 60;
const ETA_SECONDS = 56; // landmark is rescheduled this far away (at pickup speed) — tight but fair
const KERB_X = 5.9;
const SPAWN_Z = -235;

const LINES = {
  request: [
    'Bhai sahab, {place} jana hai — 60 seconds mein pohncha dein!',
    '{place} chalein ge? Bas 60 seconds hain mere paas!',
    'Ustad ji, {place} tak — full speed, 60 seconds!',
    'Take me to {place} in 60 seconds, bhai — bohat zaroori kaam hai!',
  ],
  chat: [
    'Bhai thora tez chalayein, nihari thandi ho rahi hai!',
    'Meter wala hai ya fixed rate?',
    'Ye wala rasta shortcut hai, mujh pe bharosa rakhein!',
    'Lahore Lahore aye!',
    'Wah ustad, kya driving hai — bilkul pilot!',
    'Aaj traffic thora zyada nahi lag raha?',
    'Ammi ne kaha tha time pe pohnchna, please!',
    'Horn zara pyar se bajayein, bhai.',
    'Yeh rickshaw hai ya rocket? Maza aa gaya!',
    'Raste mein chai ka stop ho sakta hai? ...Nahi? Theek hai.',
    'Gaaye ko pehle guzarne dein, woh yahan ki senior hai.',
    'Jis ne Lahore nahi dekha, woh paida hi nahi hua!',
    'Mausam kitna acha hai — bas ek lassi ki kami hai.',
    'Bhai, koi gaana laga dein, safar acha kat jaye ga.',
    'Mera dost kehta hai rickshaw se tez sirf khabar phelti hai!',
    'Itne khaddey? Free ka jhoola mil gaya!',
  ],
  success: [
    'Shukriya bhai! Time se pehle pohncha diya — ye lein kiraya.',
    'Zabardast! Aap to Lahore ke number one driver hain!',
    'Kamaal kar diya ustad! Chai meri taraf se.',
    'Wah ji wah! Agli dafa bhi aap hi ke saath.',
  ],
  fail: [
    'Bhai, is se tez to main paidal pohnch jata!',
    'Biryani khatam ho gayi hogi ab tak... chalein, koi baat nahi.',
    'Late ho gaye yaar. Agli dafa thori si jaldi, theek hai?',
    'Meri bus nikal gayi! Khair, Allah hafiz.',
  ],
  hit: ['Arey arey! Aaram se, bhai!', 'Meri chai gir gayi!', 'Bhai, yeh bumper cars nahi hain!', 'Dil ki dharkan tez ho gayi!'],
};

/** audio: { pickup(), success(), fail() } */
export function createMissions(scene, player, landmarks, ui, audio) {
  // Roadside figure: baked body, separately animated waving arm, bobbing marker overhead.
  const figure = new THREE.Group();
  figure.add(bake(buildPerson(0x8e44ad, false)));
  const arm = new THREE.Group();
  arm.position.set(0.32, 1.48, 0);
  box(arm, 0x8e44ad, 0.12, 0.6, 0.14, 0, 0.3, 0);
  figure.add(arm);
  const marker = cone(figure, new THREE.MeshBasicMaterial({ color: 0xffd60a }), 0.35, 0.8, 0, 3, 0);
  marker.rotation.x = Math.PI;
  figure.scale.setScalar(1.2);
  figure.visible = false;
  scene.add(figure);

  let mode = 'idle'; // idle | waiting | riding
  let cooldown = 0;
  let lane = 0; // lane beside the waiting passenger
  let z = 0;
  let target = null;
  let timeLeft = 0;
  let chatIn = 0;
  let chatBag = [];
  let t = 0;

  function idle(wait) {
    mode = 'idle';
    cooldown = wait;
    figure.visible = false;
    player.setPassenger(false);
    ui.mission(null);
  }
  function offer() {
    mode = 'waiting';
    lane = pick([0, 2]);
    z = SPAWN_Z;
    figure.visible = true;
    ui.toast(`Passenger ahead — ${lane ? 'RIGHT' : 'LEFT'} side!`, 2600);
  }
  function pickup() {
    mode = 'riding';
    figure.visible = false;
    player.setPassenger(true);
    // Put the next landmark a known distance away, unless it is already standing on the road ahead.
    if (!landmarks.placed) landmarks.scheduleIn(ETA_SECONDS);
    target = landmarks.upcoming;
    timeLeft = MISSION_SECONDS;
    chatIn = rand(7, 10);
    ui.speech(pick(LINES.request).replace('{place}', target.short), '', 4200);
    audio.pickup();
  }
  function finish(success) {
    if (success) {
      const fare = Math.min(500, 200 + Math.round(timeLeft * 3) * 10); // Rs. 200–500, faster = more
      game.fares += fare;
      ui.speech(`${pick(LINES.success)}  +Rs. ${fare}`, 'good', 4500);
      audio.success();
    } else {
      ui.speech(pick(LINES.fail), 'bad', 4500);
      audio.fail();
    }
    idle(rand(10, 18));
  }

  return {
    get mode() {
      return mode;
    },
    offer,
    reset: () => idle(rand(9, 13)),
    /** A hit mid-ride: the passenger has opinions. */
    onHit() {
      if (mode !== 'riding') return;
      ui.speech(pick(LINES.hit), 'bad', 2200);
      chatIn = Math.max(chatIn, 5);
    },
    onLandmark(def) {
      if (mode === 'riding' && def === target) finish(true);
    },
    update(dt, speed) {
      t += dt;
      if (mode === 'idle') {
        cooldown -= dt;
        // Only offer a ride if the passenger can be reached (235 units away) well before
        // the next landmark gets placed (260 units ahead of its arrival).
        if (cooldown <= 0 && !landmarks.placed && landmarks.distanceLeft > 520) offer();
      } else if (mode === 'waiting') {
        z += speed * dt;
        figure.position.set(lane ? KERB_X : -KERB_X, 0, z);
        arm.rotation.z = Math.sin(t * 9) * 0.5;
        marker.position.y = 3 + Math.sin(t * 4) * 0.15;
        marker.rotation.y += dt * 3;
        if (Math.abs(z) < 2.6 && Math.abs(player.x - LANES[lane]) < 1.4) pickup();
        else if (z > 12) {
          ui.toast('Passenger missed!');
          idle(rand(8, 14));
        }
      } else {
        timeLeft -= dt;
        ui.mission(`To ${target.short}`, timeLeft, MISSION_SECONDS);
        chatIn -= dt;
        if (chatIn <= 0) {
          if (!chatBag.length) chatBag = [...LINES.chat].sort(() => Math.random() - 0.5); // no repeats until all are used
          ui.speech(chatBag.pop());
          chatIn = rand(9, 13);
        }
        if (timeLeft <= 0) finish(false);
      }
    },
  };
}
