# TODO
# 1. When stopping, reset every timer
# 2. Clicking on a timer causes a render which still interferes with the interval?

let p = console.log
const pl = do p "lol"

global css body
	bg:gray8

global css html
	ff:sans
	-webkit-user-select:none
	-moz-user-select:none
	user-select:none

let interval = 1s
let max_time = 10s
let min_time = 5s
let timer_count = 20
let chance = 0.4
let score = 0

let timers = {}
for timer in [0 .. timer_count - 1]
	timers[timer] = null

def getRandomInt min, max
	min = Math.ceil(min)
	max = Math.floor(max)
	Math.floor(Math.random! * (max - min) + min)

def increment_interval id
	timers[id].current_time -= interval

tag app

	prop autorender = interval
	prop game_ticker = null

	get render?
		true

	def game_tick
		if Math.random! < chance
			let id = getRandomInt(0, timer_count)
			if timers[id] === null
				let new_time = getRandomInt min_time, max_time
				timers[id] = {}
				timers[id].original_time = new_time
				timers[id].current_time = new_time
				timers[id].interval = setInterval(increment_interval, interval, id)

	def handle_start
		game_ticker = setInterval(game_tick.bind(this), interval)

	def handle_stop
		clearInterval(game_ticker)
		game_ticker = null

	def handle_timer_click id
		if timers[id].current_time < 0
			score += 1
			clearInterval(timers[id].interval)
			timers[id] = null
		else
			clearInterval(timers[id].interval)
			timers[id] = null

	def get_timers
		timers

	def render

		css self
			w:100%

		css .header
			w:100%
			h:20px
			d:flex fld:center jc:center ai:center
			my:20px
			gap:20px

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
			d:flex fld:center jc:center ai:center
			fs:50px
			c:blue2
			rd:20px
			bd:1px solid cyan4
			cursor:pointer

		<self>

			<.header>
				if game_ticker === null
					<.start@click=handle_start> "START"
				else
					<.start@click=handle_stop> "STOP"
					<.score> "SCORE: {score}"

			<.timers>
				for own id, obj of get_timers!

					if obj === null
						<.timer>

					else
						<.timer@pointerdown=handle_timer_click(id)>
							Math.floor(obj.original_time / 1000)
							# <span[fs:20px]> Math.floor(obj.current_time / 1000)

imba.mount <app>
