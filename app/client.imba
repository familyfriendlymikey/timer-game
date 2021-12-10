let p = console.log
const pl = do p "lol"

global css body
	bg:gray8
	d:flex fld:column jc:flex-start ai:center

global css html
	ff:mono
	-webkit-user-select:none
	-moz-user-select:none
	user-select:none

let show_total_time = yes
let interval = 1s
let max_time = 5s
let min_time = 2s
let timer_count = 4
let chance = 0.5
let game_tick_interval = 10

let score = 0
let total_time = 0

let timers = {}

def increment_interval id
	timers[id].current_time -= game_tick_interval

tag app

	prop autorender = interval
	prop game_ticker = null

	get render?
		true

	get game_has_started
		game_ticker !== null

	def sample array
		array[Math.floor(Math.random! * array.length)]

	def get_random_timer
		let null_timers = []
		for own id, val of timers
			if val === null
				null_timers.push(id)
		return no if null_timers.length <= 0
		sample null_timers

	def getRandomTime min, max
		# Gets a random multiple of `interval` in range of `min` and `max` inclusive
		let delta = max - min
		Math.round((Math.random! * delta) / interval) * interval + min

	def game_tick
		total_time += game_tick_interval
		imba.commit!

		# [TODO]: This appears to work but should it?
		return unless total_time % interval === 0

		if Math.random! < chance && let id = get_random_timer!
			let new_time = getRandomTime min_time, max_time
			timers[id] = {}
			timers[id].original_time = new_time
			timers[id].current_time = new_time
			timers[id].interval = setInterval(increment_interval, game_tick_interval, id)

	def handle_start
		timers = {}
		for timer in [0 .. timer_count - 1]
			timers[timer] = null
		game_ticker = setInterval(game_tick.bind(this), game_tick_interval)

	def handle_stop
		total_time = 0
		score = 0
		clearInterval(game_ticker)
		game_ticker = null
		for own id, val of timers
			if val !== null
				clearInterval(timers[id].interval)
				timers[id] = null

	def handle_timer_click id
		let current_time = timers[id].current_time

		if current_time < 0
			score += 1

		clearInterval(timers[id].interval)
		timers[id].click_time = current_time

	def get_timers
		timers

	def render

		css self
			w:100% max-width:500px
			d:flex fld:column jc:flex-start ai:center

		css .header
			w:100%
			h:20px
			d:flex fld:center jc:space-around ai:center
			my:20px
			gap:20px

		css .header *
			fl:1
			ta:center

		css .score
			c:blue2

		css .start
			c:blue2
			cursor:pointer

		css .timers
			w:100% flex-wrap:wrap d:flex fld:row jc:center ai:center
			gap:20px

		css .timer
			w:100px
			h:100px
			bg:blue7
			d:flex fld:column jc:center ai:center
			fs:50px
			c:blue2
			rd:20px
			bd:1px solid cyan4
			cursor:pointer

		css .settings
			d:flex fld:column jc:flex-start ai:center
			w:100%
			gap:20px

		css .setting
			d:flex fld:row jc:center ai:center
			w:100%

		css .setting-name
			w:100%
			c:blue2
			fl:1

		css .setting input
			fl:1

		<self>

			if game_has_started

				<.header>
					<.score> "SCORE: {score}"
					<.start@click=handle_stop> "STOP"
					if show_total_time
						<.score> "TIME: {(total_time / 1000).toFixed(2)}"

				<.timers>
					for own id, obj of get_timers!

						if obj === null
							<.timer>

						elif obj.hasOwnProperty "click_time"
							<.timer[fs:25px] [c:green5] [c:red5]=(obj.click_time > 0)> (obj.click_time / 1000).toFixed(2)

						else
							<.timer@pointerdown=handle_timer_click(id)>
								obj.original_time / 1000
								# <span[fs:20px]> Math.floor(obj.current_time / 1000)

			else
				<.header>
					<.start@click=handle_start> "START"
				<.settings>
					<.setting>
						<.setting-name> "Show Total Time:"
						<input bind=show_total_time type="checkbox">
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Interval:"
						<input bind=interval type="number" step="0.01">
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Max Time:"
						<input bind=max_time type="number" step=interval>
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Min Time:"
						<input bind=min_time type="number" step=interval>
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Timer Count:"
						<input bind=timer_count type="number">
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Chance:"
						<input bind=chance type="number" step="0.01">
					<hr[w:100%]>
					<.setting>
						<.setting-name> "Game Tick Interval:"
						<input bind=game_tick_interval type="number" step="1">

imba.mount <app>
