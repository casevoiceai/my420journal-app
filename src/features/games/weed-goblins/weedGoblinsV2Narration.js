import { BACKGROUNDS, RACES, weaponById } from './weedGoblinsV2Rules.js'

export const FIRST_TIME_ELIZA_INTRO = `Hi, I’m Eliza, and I’ll be your Dungeon Master. If this is your first time playing, don’t worry about knowing the rules. Just tell me what you want to do when I ask, and I’ll walk you through anything else as we go.\n\nAll right. The Goblin Highlands.`

export const OPENING_NARRATION = `The theft itself takes less than ten seconds. One moment your stash tin is sitting beside your pack, green enamel, dented lid, exactly where you left it. The next, something small and barefoot rockets out from beneath the scrub with the tin clutched against its chest.\n\nFour more goblins burst after it in a confusion of elbows, rope, and equipment that appears to have been assigned by drawing lots. One is wearing a helmet backward. Another has somehow lost a shoe without slowing down. The smallest of them keeps pointing urgently toward the ridge as though the rest might otherwise forget where they are escaping to.\n\nBeyond them, the Goblin Highlands roll away in steep green shelves broken by gray stone and old timber paths. A narrow bridge crosses the gorge below, and somewhere near it a bell gives one lonely knock in the wind. The goblins are heading straight for it, and the one in front has your stash.`

export function routeNarration(routeId) {
  if (routeId === 'investigate') {
    return `You stay where you are and let the goblins disappear over the ridge. Up close, the campsite tells a much clearer story than it did from your feet. Five sets of tracks came down through the scrub, but they did not simply rush in, grab the tin, and run. One goblin circled the edge of your camp twice. Another spent enough time near your pack to flatten a patch of grass beside it. Somebody even crawled underneath a thorn bush for reasons that are currently between them and whatever god supervises goblins.\n\nNear the place where your stash had been sitting, a strand of coarse gray thread is snagged on a thorn. A few feet away, one of the thieves stepped hard into damp soil and left almost the entire bottom of a boot behind in the mud. Cut into the sole is a crooked root enclosed by a rough circle. Farther downhill, one set of tracks breaks away from the others, climbs onto a rock overlooking the trail, stays there for a moment, then rejoins the group.\n\nA lookout. They knew where your camp was, searched it before making their move, and expected you to follow. That is a remarkable amount of preparation for five people who have apparently lost one shoe, half a coat sleeve, and what looks suspiciously like somebody’s lunch during the getaway.`
  }
  if (routeId === 'high') {
    return `You let the obvious trail drop away beneath you and climb instead. The high path is less a path than a long-standing disagreement between grass, stone, and gravity, but it gives you a view the goblins do not have. From above, the gorge narrows toward Rattlebridge, and the thieves look very small as they hurry across the lower slope with your tin.\n\nThe advantage is obvious. So is the problem: the last stretch of high ground has partially slumped away, leaving a broken ledge between you and the best overlook. There is still a way through. It simply has the sort of confidence that makes you wonder whether the mountain has recently developed a sense of humor.`
  }
  return `You go after them before the last goblin has fully disappeared over the ridge. The trail drops sharply toward the gorge, and for a while you can still catch flashes of them between the scrub: a bare heel, a swinging rope, the backward helmet bouncing with every step. They are fast, but they are not subtle.\n\nThe bridge below resolves into a narrow timber crossing with a squat wooden frame at the near end. A bell hangs beneath it, and thin cords vanish between the planks. One of the goblins reaches the far side and waves frantically back toward a smaller figure stationed near the frame. Whatever that guard is supposed to do, your arrival has just become part of its problem.`
}

export function identityNarration({ raceId, routeId }) {
  const race = RACES[raceId]
  if (!race) return ''
  if (routeId === 'investigate' && raceId === 'elf') {
    return `Once you stop looking at the tracks as footprints and take in the whole hillside, another detail catches. Farther down the slope, a dull glint of metal sits half-buried in the grass where the goblins ran. You pull free a small brass clasp, bent nearly flat, with part of the same crooked-root mark scratched into one side. Whatever these thieves are involved in, it started before they saw your stash.`
  }
  if (raceId === 'dwarf') {
    return `The ground itself gives you one useful answer. The bridge approach has been repaired several times, but the newest braces are carrying more weight than they should. Whoever built the place understands timber better than stone, which may become useful if the crossing turns hostile.`
  }
  if (raceId === 'gnome') {
    return `The bridge mechanism becomes more interesting the longer you look at it. Those cords are not random decoration. They form a crude warning system with enough improvised cleverness to work and enough improvised cleverness to become dangerous to everyone nearby if handled badly.`
  }
  return `The trail ahead is unfamiliar, but the situation is not. Somebody planned the theft, somebody expected pursuit, and somebody is relying on the bridge to turn that head start into control of the road.`
}

export function weaponNarration(weaponId) {
  const weapon = weaponById(weaponId)
  if (!weapon) return ''
  const details = {
    sword: 'The sword settles at your side as the trail tightens toward the gorge, useful whether this becomes a conversation, a close fight, or a very unfortunate discussion with a rope line.',
    bow: 'The bow changes the bridge immediately. You do not have to stand beside a problem to become part of it, and the open gorge gives you sightlines the goblins probably did not design around.',
    'battle-axe': 'The battle axe makes every piece of the bridge look less permanent than it did a moment ago. Timber, alarm rig, railing, goblin confidence: all of them have now become structural questions.',
    'bo-staff': 'The bo staff is well suited to the narrow ground ahead. On a bridge, controlling where somebody can put a foot may matter more than hitting them hardest.',
    mace: 'The mace sits heavy and uncomplicated in your hand. Rattlebridge contains several things that look as though they rely on remaining unstruck.',
    daggers: 'The daggers favor the opposite solution from the open road: get close, get inside the guard’s plan, and make distance stop mattering.',
  }
  return details[weapon.id] || ''
}

export function backgroundNarration(backgroundId, routeId) {
  if (!BACKGROUNDS[backgroundId]) return ''
  if (routeId === 'high') {
    const highDetails = {
      tracker: `The broken ledge stops looking like a wall and starts looking like a trail with bad manners. Loose stone has already shown you where it wants to slide, the grass is bent where footing will hold, and the fastest line is not quite the safest one. You have enough information to choose which risk you actually want.`,
      warden: `The broken ledge is a problem of weight and position. One shelf will hold if you keep your center low, another gives you cover from the bridge, and the exposed stretch between them is where a bad step becomes expensive. You can work with that.`,
      diviner: `The high path has the uncomfortable look of a route that is technically present and spiritually unconvinced. The stone itself is ordinary, but the safe line through it does not match the obvious one. That kind of disagreement is familiar enough to be useful.`,
    }
    return highDetails[backgroundId] || ''
  }
  const bridgeDetails = {
    tracker: `Rattlebridge comes into focus the way a trail does once you know what disturbed it. The guard’s weight keeps drifting toward the alarm frame, the warning lines pull toward the left rail, and two replacement boards near the center sit a fraction higher than the rest. None of that decides your move for you, but it shows you where the guard expects trouble and where the crossing may give you an opening.`,
    warden: `Rattlebridge is a chokepoint before it is anything else. The guard has one useful position beside the alarm, one narrow route it needs to deny, and almost nowhere to retreat without giving something up. If this becomes a contest over space, you already know which pieces of ground matter.`,
    diviner: `Nothing about the alarm feels enchanted, which is useful in its own way. The oddness here is physical: crossed lines, blind angles, repeated repairs, and a route whose shape changes depending on where the guard is standing. It is the sort of pattern that can become very strange very quickly if you decide to lean on it.`,
  }
  return bridgeDetails[backgroundId] || ''
}

export function rattlebridgeArrival(state) {
  const alarmText = state.alarm === 'threatened'
    ? 'The Highland Sneak already has one hand on the alarm mechanism and is trying to get the warning started before you can interfere.'
    : state.route === 'direct' && state.alarm === 'quiet'
      ? 'You arrived fast enough to catch the guard before the warning has started. The Highland Sneak has one hand hovering near the alarm mechanism, but the cords are still slack and the bell is still quiet.'
      : state.stealth === 'unseen'
        ? 'From the side approach, the Highland Sneak has not found you yet. It keeps glancing down the main trail, exactly where it expects trouble to arrive.'
        : 'A Highland Sneak waits near the alarm frame, alert enough to know the trail is wrong but not yet certain where the trouble is coming from.'
  return `Rattlebridge is narrower up close, forty feet of old planks and newer repairs stretched over a gorge that would prefer you not test either. The alarm rig at the near end is a mess of cords, a bell, and small pieces of metal threaded beneath the boards. ${alarmText}\n\nThe guard is small even by goblin standards, with a hookknife, a patched leather coat, and the concentrated expression of somebody who has been given one important job and very little confidence that the universe intends to let them finish it.`
}

export function combatStartNarration({ returning = false } = {}) {
  if (returning) {
    return `You close the distance again. This time neither of you is starting from scratch: the Sneak has already seen how you move, and you know exactly how quickly that hookknife comes up when the bridge gets crowded. Both of you reset your footing and commit to another exchange.`
  }
  return `The choice closes the distance between argument and violence. The Highland Sneak brings the hookknife up, plants one foot beside the alarm rig, and the fight becomes real enough for initiative.`
}

export function highRouteResultNarration({ success, natural }) {
  if (success) {
    return `The high trail makes you work for every yard, but it does not get the final vote. You reach the overlook with the bridge below and the guard still watching the wrong approach. For the moment, you have position and surprise.`
  }
  if (natural === 1) {
    return `The ledge holds until the exact moment you trust it. Stone gives way under one foot and sends you sliding through thorn and loose gravel before you catch yourself lower on the slope. You still reach the bridge, because failure here changes the approach rather than erasing it, but you arrive scraped, late, and no longer invisible.`
  }
  return `The high route does not give you the clean overlook you wanted. A section of ledge forces you down early, costing time and skin, but it still leaves you on the side of Rattlebridge instead of sending you back to the beginning.`
}

export function checkResultNarration({ actionId, success, natural, state }) {
  if (actionId === 'bridge:interrupt-alarm') {
    return success
      ? `The warning never becomes a warning. You catch the mechanism in the middle of its work and force it back into silence, leaving the Sneak staring at the rig as though it has personally betrayed them.`
      : `You move before the guard finishes, but not quite before the mechanism does. The cords snap tight beneath the bridge and the bell finally gives a proper answer to the wind. Somewhere beyond the gorge, somebody now knows Rattlebridge has a problem.`
  }
  if (actionId === 'bridge:disable-alarm') {
    return success
      ? `You get to the alarm before the guard understands what you are doing. A little pressure in the right place is enough; the rig sags uselessly, still present but no longer capable of carrying a warning across the bridge.`
      : `The mechanism turns out to be cruder than it looks and therefore much harder to predict. By the time you find the part that matters, the Sneak has found you. One hand goes to the warning line, and the quiet part of the encounter is over.`
  }
  if (actionId === 'bridge:bypass') {
    if (state?.alarm === 'raised') {
      return success
        ? `The bell has already done whatever damage it was going to do, so subtlety is no longer the point. You catch the Sneak on the wrong side of the bridge, drive through the opening, and leave the guard behind before it can close the crossing.`
        : `You nearly get past while the Sneak is still reorganizing, but the guard recovers in time to cut off the line. The warning is already out; now the problem is simply that the goblin is still physically between you and the far side.`
    }
    return success
      ? `The crossing opens for a few seconds and you use every one of them. The guard never gets a clean sightline, the alarm stays out of the conversation, and by the time the Sneak understands where you went, Rattlebridge is already behind you.`
      : `The route almost works. Almost is enough to get you farther across, but not enough to stay unnoticed. A plank shifts under your weight, the Sneak whips around, and the bridge becomes a much more immediate place.`
  }
  if (actionId === 'bridge:bargain') {
    if (success && state?.discoveries?.some((item) => item.id === 'stolen-stash-is-tribute')) {
      return `The Sneak’s attention fixes on the crooked-root mark, and for the first time the hookknife seems less important than the fact that you found it. “That tin isn’t staying here,” the goblin says. “The King put it with the tribute goods. It leaves the Highlands with the rest.”\n\nThe Sneak glances back toward the trail, immediately regretting how much of that sentence escaped. Then it steps away from the alarm frame and lowers the knife. “You did not hear that from me.” The bridge is open.`
    }
    if (!success && state?.alarm === 'raised') {
      return `The Sneak hears you out, but whatever chance there was to make this simple disappeared with the bell. The goblin keeps the hookknife up and refuses to give you the crossing. At this point the warning is not the leverage; the guard itself is.`
    }
    return success
      ? `The guard listens because the alternative is beginning to look worse. The hookknife does not disappear, but it lowers. Whatever understanding you have just created is imperfect, temporary, and real enough to get you through.`
      : `The Sneak hears you out with the rigid attention of somebody trying very hard not to be persuaded. Whatever you were hoping to get from the conversation, the goblin gives you nothing useful. Instead, one foot inches toward the alarm frame while the hookknife stays between you.`
  }
  if (actionId === 'combat:interrupt-alarm') {
    return success
      ? `You get between the Sneak and the warning at the exact moment the mechanism becomes dangerous. The live line goes slack again, and your pressure forces the goblin away from the alarm side of the bridge. The bell is quiet. For now, the Sneak has to deal with you before it can try that again.`
      : `You go for the live alarm line, but the Sneak keeps just enough control of the mechanism to hold it ready. The warning has not gone through yet. The bad news is that the goblin gets the next move with the line already in its hand.`
  }
  if (actionId === 'ability:tracker-bridge') {
    return success
      ? `You stop treating the crossing as something that needs permission. The Tracker’s read of the ground gives you the one line the guard cannot close in time, and you drive through it before the situation can reorganize around you.`
      : `You commit to the opening, but the ground refuses to stay as readable as it looked. The push still gets you farther into the crossing; it just leaves the guard with a much better idea of exactly where you are.`
  }
  if (actionId === 'ability:warden-bridge') {
    return success
      ? `You read the bridge as a defensive problem instead of a race. One safe line becomes two, the Sneak loses the angle it was counting on, and suddenly the crossing belongs to your positioning rather than its warning plan.`
      : `You find the line you want, but the Sneak adjusts before you can own it. You are not pushed back to the start; the bridge simply becomes contested ground with the guard fully aware of how you mean to take it.`
  }
  if (actionId === 'ability:diviner-bridge') {
    return success
      ? `For a moment the bridge stops making sense in the ordinary way and starts making sense in yours. The cords, planks, and blind angles settle into a route that was never drawn but was apparently waiting to be noticed, and you follow it through before the guard understands what changed.`
      : `The wrong map answers, but not cleanly. You catch the shape of the safe route a heartbeat too late, enough to keep moving and not enough to remain mysterious. The Sneak now knows there is magic in the problem.`
  }
  if (actionId === 'combat:control') {
    return success
      ? `You turn the weapon and the bridge into the same problem. The Sneak gives ground, its footing gets worse, and a little of the confidence goes out of its face.`
      : `The idea is sound. The timing is not. The Sneak slips around the pressure and leaves you in a worse position for the next exchange.`
  }
  if (actionId === 'ability:tracker-combat') {
    return success
      ? `You push through the space the Sneak meant to deny you and make it give ground. The move does not need to draw blood to matter; its next decision now starts from a worse position and with less confidence.`
      : `You spend the effort and commit to the pressure, but the Sneak wriggles out of the line before you can close it. The Mana is gone, the position is not yours, and the guard gets the next say.`
  }
  if (actionId === 'ability:warden-combat') {
    return success
      ? `You take away the piece of bridge the Sneak was trying to use and hold it. The goblin can still fight, but it cannot have the position, the alarm, and you all at once anymore.`
      : `You set the line and the Sneak refuses to meet it where you want. It slips just far enough around the pressure to keep the position unsettled, leaving the technique spent without giving you control for free.`
  }
  if (actionId === 'combat:retreat') {
    if (state?.alarm === 'raised') {
      return success
        ? `The bell has already rung, so there is nothing left to save by hovering near the alarm. You break contact cleanly, put several steps between yourself and the hookknife, and force the Sneak to decide whether it wants another fight or simply wants the bridge.`
        : `You get your distance, but the Sneak makes you pay for it in position. The bell has already rung; what the goblin gains now is control of the crossing rather than another warning.`
    }
    return success
      ? `You break contact on your terms and put space back between you and the hookknife. The fight is over for the moment, but the guard is still part of the bridge problem.`
      : `You get away, but not cleanly. The Sneak uses the opening to improve its warning position, which means the retreat solves one problem while making another one louder.`
  }
  return natural === 1
    ? `The attempt goes wrong in a way that matters, but the road does not disappear. The situation changes around the failure and leaves you with a different problem to solve.`
    : success
      ? `The attempt works, and the bridge changes with it.`
      : `The attempt fails, but it does not reset the scene. The consequences stay in the world and the next choice begins from here.`
}

export function attackNarration({ hit }) {
  if (!hit) return `Your attack does not find the opening you wanted. The Sneak gets through the exchange intact and immediately starts looking for what it can do with the space you just gave it.`
  return `Your attack finds the opening. The hit is real; now the only question is how much it costs the Sneak.`
}

export function damageNarration({ damage, enemyHealth }) {
  return `The damage lands for ${damage}. The Highland Sneak is ${enemyHealth.toLowerCase()} now, and its attention has shifted from doing its job neatly to deciding whether the job is worth what it is becoming.`
}

export function enemyTurnNarration({ action, hit = null, damage = 0, round = 1 }) {
  if (action === 'prepare-alarm') {
    return `The Sneak does not waste the opening on you. It lunges for the alarm rig instead, yanking one cord into position. The warning has not gone through yet, but one more clean action will do it.`
  }
  if (action === 'raise-alarm') {
    return `The Sneak finishes what it started. The line snaps tight beneath the planks and the bell carries across the gorge. Whatever waits farther into the Highlands has just been told that something is coming.`
  }
  if (action === 'retreat-report') {
    return `The Sneak decides that surviving with useful information is better than dying beside a bell. It breaks away from the bridge and runs for the camp, which means the fight has ended but the consequences have not.`
  }
  if (action === 'attack' && hit) {
    return round % 2 === 0
      ? `The Sneak darts in from the alarm side and catches you before you can close the angle. The hookknife bites for ${damage} damage, and the goblin is already pulling back before the opening disappears.`
      : `The Sneak commits to the hookknife and gets through your guard. The blade does ${damage} damage before the goblin pulls back into the narrow space beside the alarm rig.`
  }
  if (action === 'attack') {
    return round % 2 === 0
      ? `The Sneak tries to slip the hookknife through the opening beside your weapon, but you close it in time. The goblin recoils, annoyed, and shifts its feet before trying to build another angle.`
      : `The Sneak comes in with the hookknife, but the attack never gets cleanly through your guard. It recoils into position and looks immediately for another way to keep you from controlling the crossing.`
  }
  return ''
}

export function cloudberryNarration(state) {
  const warning = state.campAwareness === 'warned'
    ? 'The camp ahead has warning now, and you can already see signs of movement where the trail rises beyond the next shelf.'
    : state.world.sneak.reportProcess?.status === 'in-progress'
      ? 'The guard escaped toward the camp, so the warning is moving through the world even if it has not arrived yet.'
      : 'For the moment, nothing ahead suggests the camp knows exactly how Rattlebridge ended.'

  const pursuit = state.timePressure === 'close'
    ? 'You never gave the thieves enough room to vanish properly. Bent grass and fresh scuffs continue off the shelf, and somewhere ahead the stash carrier is still close enough that this remains a pursuit rather than a search.'
    : state.timePressure === 'normal'
      ? 'The thieves have a lead, but not a comfortable one. Their trail is still fresh enough to follow without stopping to reconstruct every turn.'
      : state.timePressure === 'delayed'
        ? 'Rattlebridge cost you time. The thieves are out of sight now, and the trail ahead will have to do more of the work if you want to close the distance again.'
        : 'Whatever close pursuit you had is gone. The thieves have had enough time to disappear into the Highlands, leaving you with a direction, a trail, and the consequences you carried off the bridge.'

  return `Cloudberry Shelf opens above the gorge in a broad patch of wind-flattened grass and pale berry shrubs. Rattlebridge is behind you, but its outcome has followed. ${warning}\n\n${pursuit}`
}
