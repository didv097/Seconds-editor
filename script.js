let cont_file_upload = document.getElementById("cont-file-upload");
let cont_browser = document.getElementById("cont-browser");

let btn_builder = document.getElementById("btn-builder");
let btn_process = document.getElementById("btn-process");
let input_csv = document.getElementById("csv-upload");
let opt_workout = document.getElementById("opt-workout");

let btn_previous = document.getElementById("btn-previous");
let btn_next = document.getElementById("btn-next");
let text_workout_id = document.getElementById("workout-id");
let text_workout_name = document.getElementById("workout-name");
let btn_back10 = document.getElementById("btn-back10s");
let btn_play = document.getElementById("btn-play");
let btn_pause = document.getElementById("btn-pause");
let btn_forward10 = document.getElementById("btn-forward10s");
let text_cur_time = document.getElementById("cur-playback");
let progressbar = document.getElementById("progress-bar");
let cont_exercises = document.getElementById("cont-exercises");
let btn_add_exercise = document.getElementById("btn-add-exercise");
let btn_add_rest = document.getElementById("btn-add-rest");
let btn_add_intro = document.getElementById("btn-add-intro");
let btn_add_outro = document.getElementById("btn-add-outro");
let text_exercise = document.getElementById("text-exercise");
let opt_exercises = document.getElementById("opt-exercises");
let btn_match = document.getElementById("btn-match");
let input_start_time = document.getElementById("input-start-time");
let input_duration = document.getElementById("input-duration");
let input_end_time = document.getElementById("input-end-time");
let btn_save = document.getElementById("btn-save");
let btn_save_all = document.getElementById("btn-save-all");

let selectedIndex;
let audio;
let workouts = []; // id, name, mp3, live_data
let intervals = [];	// type, name, duration, start, end
let exercises = []; // name, id
let selectedWorkout = -1;
let dur_audio = 0, cur_time = 0;
let cur_interval = -1, cur_exercise = -1;
let cur_start_time = 0, cur_duration = 0, cur_end_time = 0;
let json_content = {};
let drag_x = 0, drag_idx = -1;

input_csv.onchange = () => {
	opt_workout.length = 0;
	workouts = [];
	if (input_csv.files.length <= 0) {
		return;
	}
	let fileReader = new FileReader();
	fileReader.readAsText(input_csv.files[0]);
	fileReader.onload = () => {
		let res = fileReader.result.split("\n");
		for (i = 1; i < res.length; i++) {
			let res1 = res[i].split(",");
			let st_br = res1[2].lastIndexOf("(");
			let en_br = res1[2].lastIndexOf(")");
			if (st_br >= 0) {
				res1[2] = res1[2].slice(st_br + 1, en_br);
			}
			st_br = res1[3].lastIndexOf("(");
			en_br = res1[3].lastIndexOf(")");
			if (st_br >= 0) {
				res1[3] = res1[3].slice(st_br + 1, en_br);
			}
			workouts.push({
				id: res1[0],
				name: res1[1],
				mp3: res1[2],
				live_data: res1[3]
			});
			let opt = document.createElement("option");
			opt.text = res1[1];
			opt_workout.add(opt);
		}
	}
}
let xHttpCSV = new XMLHttpRequest();
xHttpCSV.open("GET", "Workouts 1.0-Grid view - Exercises.csv", true);
opt_exercises.innerHTML = "";
xHttpCSV.addEventListener("load", () => {
	if (xHttpCSV.readyState == 4 && xHttpCSV.status == 200) {
		let res = xHttpCSV.responseText.split("\n");
		for (i = 1; i < res.length; i ++) {
			let res1 = res[i].split(",");
			exercises.push({
				name: res1[0],
				id: res1[1]
			});
			let opt = document.createElement("option");
			opt.text = res1[0];
			opt_exercises.add(opt);
		}
	}
});
xHttpCSV.send(null);
function getExerciseId(name) {
	for (let ex of exercises) {
		if (ex.name.toLowerCase() == name.toLowerCase()) {
			return ex.id;
		}
	}
	return 0;
}
function getIntervalElement(idx) {
	return document.getElementById("exercise-" + idx);
}
function removeInterval(idx) {
	if (idx < intervals.length - 1) {
		for (let j = idx + 1; j < intervals.length; j ++) {
			intervals[j].start_time -= intervals[idx].duration;
			intervals[j].end_time -= intervals[idx].duration;
			getIntervalElement(j).id = "exercise-" + (j - 1);
		}
	}
	intervals.splice(idx, 1);
	cont_exercises.removeChild(getIntervalElement(idx));
}
function gotoInterval(idx) {
	// cur_interval = idx;
	cur_time = intervals[idx].start_time;
	audio.currentTime = cur_time;
}

function updateIntervals() {
	if (cur_interval < 0) {
		return;
	}
	if (cur_interval > 0) {
		intervals[cur_interval].start_time = cur_start_time;
		intervals[cur_interval - 1].end_time = cur_start_time;
		intervals[cur_interval - 1].duration = cur_start_time - intervals[cur_interval - 1].start_time;
		getIntervalElement(cur_interval - 1).style.width = (intervals[cur_interval - 1].duration / dur_audio * 100) + "%";
	}
	intervals[cur_interval].end_time = cur_end_time;
	intervals[cur_interval].duration = cur_end_time - intervals[cur_interval].start_time;
	getIntervalElement(cur_interval).style.width = (intervals[cur_interval].duration / dur_audio * 100) + "%";
	if (cur_interval < intervals.length - 1) {
		intervals[cur_interval + 1].start_time = cur_end_time;
		intervals[cur_interval + 1].duration =intervals[cur_interval + 1].end_time - cur_end_time;
		getIntervalElement(cur_interval + 1).style.width = (intervals[cur_interval + 1].duration / dur_audio * 100) + "%";
	}
}

function resizeInterval(offT) {
	if (drag_idx < 0) {
		return;
	}
	intervals[drag_idx].duration += offT;
	intervals[drag_idx].end_time += offT;
	if (drag_idx < intervals.length - 1) {
		intervals[drag_idx + 1].duration -= offT;
		intervals[drag_idx + 1].start_time += offT;
		cont_exercises.children[drag_idx + 1].style.width = intervals[drag_idx + 1].duration / dur_audio * 100 + "%";
	}
	cont_exercises.children[drag_idx].style.width = intervals[drag_idx].duration / dur_audio * 100 + "%";
}

function finishResizeInterval() {
	if (drag_idx < 0) {
		return;
	}
	intervals[drag_idx].duration = Math.round(intervals[drag_idx].duration);
	intervals[drag_idx].duration = Math.max(intervals[drag_idx].duration, 1);
	intervals[drag_idx].end_time = intervals[drag_idx].start_time + intervals[drag_idx].duration;
	if (drag_idx < intervals.length - 1) {
		intervals[drag_idx + 1].start_time = intervals[drag_idx].end_time;
		intervals[drag_idx + 1].duration = intervals[drag_idx + 1].end_time - intervals[drag_idx + 1].start_time;
	}
	if (cur_interval >= 0) {
		cur_start_time = intervals[cur_interval].start_time;
		cur_duration = intervals[cur_interval].duration;
		cur_end_time = intervals[cur_interval].end_time;
		input_start_time.value = cur_start_time;
		input_duration.value = cur_duration;
		input_end_time.value = cur_end_time;
	}
	drag_idx = -1;
}

document.body.onmouseup = () => {
	cont_exercises.onmousemove = () => {};
	document.body.style.cursor = "auto";
	finishResizeInterval();
}

function btnProcessClicked() {
	selectedIndex = opt_workout.selectedIndex;
	if (selectedIndex < 0) {
		return;
	}
	cont_file_upload.style.display = "none";
	cont_browser.style.display = "block";

	text_workout_id.innerText = workouts[selectedIndex].id;
	text_workout_name.innerText = workouts[selectedIndex].name;

	if (audio) {
		audio.pause();
		audio.remove();
	}
	audio = new Audio(workouts[selectedIndex].mp3);
	drag_idx = -1;
	audio.onerror = () => {
		location.reload();
		console.log("Error loading audio");
	}
	audio.onloadeddata = () => {
		dur_audio = parseInt(audio.duration);
		document.getElementById("audio-duration").innerText = ("00" + parseInt(dur_audio / 60).toString()).slice(-2)
			+ ":" + ("00" + parseInt(dur_audio % 60).toString()).slice(-2);
		audio.play();
		cur_time = 0;
		progressbar.style.width = "0%";

		json_content = {};
		intervals = [];
		cont_exercises.innerHTML = "";
		let xHttp = new XMLHttpRequest();
		xHttp.open("GET", workouts[selectedIndex].live_data, true);
		xHttp.onreadystatechange = () => {
			if (xHttp.readyState == 4) {
				if (xHttp.status != 200 || xHttp.responseText[0] != "{") {
					json_content = { 
						"overrun":false,
						"lastPerformedTimeInterval":0,
						"intervals":[],
						"numberOfSets":9,
						"_type":"cust",
						"soundScheme":1,
						"music":{ 
							 "_type":"music",
							 "shuffle":false,
							 "volume":1,
							 "resume":true,
							 "persist":false
						},
						"type":0,
						"identifier":workouts[selectedIndex].id,
						"name": workouts[selectedIndex].name,
						"activity":0
				 };
					intervals = [];
					console.log('no data')
					console.log(xHttp)
				} else {
					console.log('data')
					console.log(xHttp)
					json_content = JSON.parse(xHttp.responseText);
					if (json_content.hasOwnProperty("overrun")) {
						intervals = json_content.intervals;
					} else {
						intervals = json_content.packs[0].items[0].intervals;
					}
					let temp = 0;
					for (let i = 0; i < intervals.length; i ++) {
						intervals[i].start_time = temp;
						temp += intervals[i].duration;
						if (temp > dur_audio) {
							intervals.length = i;
							break;
						}
						intervals[i].end_time = temp;
						intervals[i].type = intervals[i].name.toLowerCase();
						if (intervals[i].type != "intro" && intervals[i].type != "outro" && intervals[i].type != "rest") {
							intervals[i].type = "exercise";
							let temp1 = intervals[i].name.indexOf(" - ");
							if (temp1 >= 0) {
								intervals[i].id = intervals[i].name.slice(0, temp1);
								intervals[i].name = intervals[i].name.slice(temp1 + 3);
							} else {
								intervals[i].id = getExerciseId(intervals[i].name);
							}
						}
						let elem_interval = document.createElement("div");
						elem_interval.classList = ["exercise"];
						if (intervals[i].type != "exercise") {
							elem_interval.classList.add(intervals[i].type);
						}
						elem_interval.style.width = (intervals[i].duration / dur_audio * 100) + "%";
						elem_interval.id = "exercise-" + i;
						let elem_icon = document.createElement("span");
						elem_icon.className = "exer-icon";
						elem_icon.innerHTML = "&#x1f5d1;";
						elem_icon.onclick = (event) => {
							let idx = Number(event.target.parentElement.id.slice(9));
							if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
								removeInterval(idx);
							}
						};
						let elem_name = document.createElement("span");
						elem_name.className = "exer-name";
						elem_name.innerHTML = intervals[i].name;
						elem_name.onclick = (event) => {
							let idx = Number(event.target.parentElement.id.slice(9));
							if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
								gotoInterval(idx);
							}
						};
						elem_interval.appendChild(elem_icon);
						elem_interval.appendChild(elem_name);
						elem_interval.onmousedown = (event) => {
							let idx = Number(event.target.parentElement.id.slice(9));
							if (!(idx >= 0 && idx < intervals.length)) {
								return;
							}
							if (event.offsetX < 5) {
								if (idx == 0) {
									return;
								}
								idx --;
							} else if (event.target.offsetWidth - event.offsetX >= 5) {
								return;
							}
							drag_x = event.x;
							document.body.style.cursor = "col-resize";
							drag_idx = idx;
							cont_exercises.onmousemove = (event1) => {
								resizeInterval((event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
								drag_x = event1.x;
							}
						}
						cont_exercises.appendChild(elem_interval);
					}
				}
			}
		};
		xHttp.send(null);
	};
	audio.ontimeupdate = () => {
		cur_time = audio.currentTime;
		text_cur_time.innerText = ("00" + parseInt(cur_time / 60).toString()).slice(-2)
			+ ":" + ("00" + parseInt(cur_time % 60).toString()).slice(-2);
		progressbar.style.width = (100 * cur_time / dur_audio) + "%";
		let i;
		for (i = 0; i < intervals.length; i ++) {
			if (cur_time < intervals[i].end_time) {
				if (cur_interval == i) {
					return;
				}
				cur_interval = i;
				break;
			}
		}
		if (i >= intervals.length) {
			cur_interval = -1;
			cur_start_time = 0;
			cur_duration = 0;
			cur_end_time = 0;
			input_start_time.value = 0;
			input_duration.value = 0;
			input_end_time.value = 0;
			text_exercise.innerText = "";
		} else {
			cur_start_time = intervals[cur_interval].start_time;
			cur_duration = intervals[cur_interval].duration;
			cur_end_time = intervals[cur_interval].end_time;
			input_start_time.value = cur_start_time;
			input_duration.value = cur_duration;
			input_end_time.value = cur_end_time;
			text_exercise.innerText = intervals[cur_interval].name;
			if (intervals[cur_interval].type == "exercise") {
				btn_match.className = "btn btn-danger";
				btn_match.innerText = "Not match";
				opt_exercises.value = "";
				opt_exercises.style.display = "block";
				for (ex of exercises) {
					if (cur_interval >= 0 && intervals[cur_interval].name.toLowerCase() == ex.name.toLowerCase()) {
						btn_match.className = "btn btn-success";
						btn_match.innerText = "Match";
						opt_exercises.value = ex.name;
						break;
					}
				}
			} else {
				btn_match.className = "btn light";
				btn_match.innerText = "";
				opt_exercises.value = ""
				opt_exercises.style.display = "none";
			}
		}
	};
	opt_exercises.onchange = () => {
		if (opt_exercises == "" || cur_interval < 0 || intervals[cur_interval].type != "exercise") {
			return;
		}
		intervals[cur_interval].name = opt_exercises.value;
		getIntervalElement(cur_interval).children[1].innerText = opt_exercises.value;
	}
	function addInterval(type) {
		let new_idx = intervals.length;
		let remaning_time, start_time;
		if (new_idx == 0) {
			remaning_time = dur_audio;
			start_time = 0;
		} else {
			remaning_time = dur_audio - intervals[new_idx - 1].end_time;
			start_time = intervals[new_idx - 1].end_time;
		}
		if (remaning_time <= 0) {
			return;
		}
		let new_interval = {
			name: type,
			type: type.toLowerCase(),
			id: getExerciseId(type),
			start_time: start_time,
			duration: Math.min(remaning_time, 20)
		};
		new_interval.end_time = new_interval.start_time + new_interval.duration;
		intervals.push(new_interval);
		let elem_interval = document.createElement("div");
		elem_interval.classList = ["exercise"];
		if (type != "exercise") {
			elem_interval.classList.add(type.toLowerCase());
		}
		elem_interval.style.width = (new_interval.duration / dur_audio * 100) + "%";
		elem_interval.id = "exercise-" + new_idx;
		let elem_icon = document.createElement("span");
		elem_icon.className = "exer-icon";
		elem_icon.innerHTML = "&#x1f5d1;";
		elem_icon.onclick = () => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
				removeInterval(idx);
			}
		};
		let elem_name = document.createElement("span");
		elem_name.className = "exer-name";
		elem_name.innerHTML = new_interval.name;
		elem_name.onclick = () => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
				gotoInterval(idx);
			}
		};
		elem_interval.appendChild(elem_icon);
		elem_interval.appendChild(elem_name);
		elem_interval.onmousedown = (event) => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (!(idx >= 0 && idx < intervals.length)) {
				return;
			}
			if (event.offsetX < 5) {
				if (idx == 0) {
					return;
				}
				idx --;
			} else if (event.target.offsetWidth - event.offsetX >= 5) {
				return;
			}
			drag_x = event.x;
			document.body.style.cursor = "col-resize";
			drag_idx = idx;
			cont_exercises.onmousemove = (event1) => {
				resizeInterval((event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
				drag_x = event1.x;
			}
		}
		cont_exercises.appendChild(elem_interval);
	}
	btn_add_exercise.onclick = () => {
		addInterval("Exercise");
	};
	btn_add_rest.onclick = () => {
		addInterval("Rest");
	};
	btn_add_intro.onclick = () => {
		addInterval("Intro");
	};
	btn_add_outro.onclick = () => {
		addInterval("Outro");
	};
	btn_save_all.onclick = () => {
		let temp = {};
		Object.assign(temp, json_content);
		let temp1 = [];
		for (let it of intervals) {
			temp1.push({
				"splitRest": 0,
				"ducked": false,
				"rest": false,
				"music":{ 
					"_type":"music",
					"shuffle":false,
					"volume":1,
					"resume":false,
					"persist":false
				},
				"color":0,
				"indefinite":false,
				"split":false,
				"vibration":true,
				"halfwayAlert":false,
				"duration":it.duration,
				"_type":"int",
				"name": it.id ? it.id + " - " + it.name : it.name
			});
		}
		if (temp.hasOwnProperty("overrun")) {
			temp.intervals = temp1;
		} else {
			temp.packs[0].items[0].intervals = temp1;
		}
		btn_save_all.setAttribute("href", "data:" + "application/json" + "," + encodeURIComponent(JSON.stringify(temp, null, "   ")))
		btn_save_all.setAttribute("download", workouts[selectedIndex].id + " - " + workouts[selectedIndex].name + ".seconds");
	};
	/* btnProcessClicked() */
}
input_start_time.onchange = () => {
	if (cur_interval < 0) {
		return;
	}
	if (cur_interval <= 0) {
		input_start_time.value = 0;
		input_duration.value = cur_end_time;
		return;
	}
	if (input_start_time.value >= cur_end_time || input_start_time.value <= intervals[cur_interval - 1].start_time) {
		input_start_time.value = cur_start_time;
	}
	cur_start_time = Number(input_start_time.value);
	cur_duration = cur_end_time - cur_start_time;
	input_duration.value = cur_duration;
	updateIntervals();
};
input_duration.onchange = () => {
	if (cur_interval < 0) {
		return;
	}
	cur_duration = Number(input_duration.value);
	cur_end_time = cur_start_time + cur_duration;
	input_end_time.value = cur_end_time;
	updateIntervals();
};
input_end_time.onchange = () => {
	if (cur_interval < 0) {
		return;
	}
	if (cur_interval > intervals.length - 1) {
		input_end_time.value = cur_end_time;
		return;
	}
	if (input_end_time.value <= cur_start_time) {
		input_end_time.value = cur_end_time;
	}
	if (cur_interval == intervals.length - 1) {
		if (input_end_time.value > dur_audio) {
			input_end_time.value = cur_end_time;
		}
	} else if (input_end_time.value >= intervals[cur_interval + 1].end_time) {
		input_end_time.value = cur_end_time;
	}
	cur_end_time = Number(input_end_time.value);
	cur_duration = cur_end_time - cur_start_time;
	input_duration.value = cur_duration;
	updateIntervals();
};
btn_process.onclick = () => btnProcessClicked();
btn_play.onclick = () => {
	audio.play();
	input_start_time.readOnly = true;
	input_duration.readOnly = true;
	input_end_time.readOnly = true;
};
btn_pause.onclick = () => {
	audio.pause();
	input_start_time.readOnly = false;
	input_duration.readOnly = false;
	input_end_time.readOnly = false;
};
btn_back10.onclick = () => {
	cur_time -= 10;
	cur_time = Math.max(cur_time, 0);
	audio.currentTime = cur_time;
};
btn_forward10.onclick = () => {
	cur_time += 10;
	cur_time = Math.min(cur_time, dur_audio);
	audio.currentTime = cur_time;
};
btn_previous.onclick = () => {
	if (selectedIndex > 0) {
		opt_workout.selectedIndex --;
		btnProcessClicked();
	}
};
btn_next.onclick = () => {
	if (selectedIndex < workouts.length - 1) {
		opt_workout.selectedIndex ++;
		btnProcessClicked();
	}
};
input_start_time.oninput = () => {
	input_duration.value = input_end_time.value - input_start_time.value;
};
input_duration.oninput = () => {
	input_end_time.value = cur_start_time + Number(input_duration.value);
};
input_end_time.oninput = () => {
	input_duration.value = input_end_time.value - input_start_time.value;
};

/* --------------------------- builder ------------------------------ */

btn_builder.addEventListener("click", () => {
	cont_file_upload.style.display = "none";
	cont_browser.style.display = "block";
	document.getElementById("btn-previous").parentElement.parentElement.style.display = "none";
	document.getElementById("btn-back10s").parentElement.style.display = "none";
	document.getElementById("cur-playback").style.display = "none";
	document.getElementsByClassName("progress")[0].style.display = "none";
	input_start_time.readOnly = false;
	input_duration.readOnly = false;
	input_end_time.readOnly = false;
	opt_exercises.selectedIndex = -1;
	intervals = [];
	cont_exercises.innerHTML = "";
	dur_audio = 120;
	cur_interval = -1;

	function gotoInterval(idx) {
		cur_interval = idx;
		if (cur_interval < 0) {
			return;
		}
		text_exercise.innerText = intervals[cur_interval].name;
		cur_start_time = intervals[cur_interval].start_time;
		cur_duration = intervals[cur_interval].duration;
		cur_end_time = intervals[cur_interval].end_time;
		input_start_time.value = cur_start_time;
		input_duration.value = cur_duration;
		input_end_time.value = cur_end_time;
		if (intervals[cur_interval].type == "exercise") {
			btn_match.className = "btn btn-danger";
			btn_match.innerText = "Not match";
			opt_exercises.style.display = "block";
			opt_exercises.value = "";
			for (ex of exercises) {
				if (intervals[cur_interval].name.toLowerCase() == ex.name.toLowerCase()) {
					btn_match.className = "btn btn-success";
					btn_match.innerText = "Match";
					opt_exercises.value = ex.name;
					break;
				}
			}
		} else {
			btn_match.className = "btn light";
			btn_match.innerText = "";
			opt_exercises.value = "";
			opt_exercises.style.display = "none";
		}
	}
	function addInterval(type) {
		cur_interval = intervals.length;
		let new_interval = {
			name: type,
			type: type.toLowerCase(),
			id: getExerciseId(type),
			start_time: cur_interval == 0 ? 0 : intervals[cur_interval - 1].end_time,
			duration: 20
		};
		new_interval.end_time = new_interval.start_time + new_interval.duration;
		intervals.push(new_interval);
		let elem_interval = document.createElement("div");
		elem_interval.classList = ["exercise"];
		if (type != "exercise") {
			elem_interval.classList.add(type.toLowerCase());
		}
		elem_interval.style.width = (new_interval.duration / dur_audio * 100) + "%";
		elem_interval.id = "exercise-" + cur_interval;
		let elem_icon = document.createElement("span");
		elem_icon.className = "exer-icon";
		elem_icon.innerHTML = "&#x1f5d1;";
		elem_icon.onclick = (event) => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
				removeInterval(idx);
			}
		};
		let elem_name = document.createElement("span");
		elem_name.className = "exer-name";
		elem_name.innerHTML = new_interval.name;
		elem_name.onclick = (event) => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (event.offsetX >= 5 && event.offsetX <= event.target.offsetWidth - 5) {
				gotoInterval(idx);
			}
		};
		elem_interval.appendChild(elem_icon);
		elem_interval.appendChild(elem_name);
		elem_interval.onmousedown = (event) => {
			let idx = Number(event.target.parentElement.id.slice(9));
			if (!(idx >= 0 && idx < intervals.length)) {
				return;
			}
			if (event.offsetX < 5) {
				if (idx == 0) {
					return;
				}
				idx --;
			} else if (event.target.offsetWidth - event.offsetX >= 5) {
				return;
			}
			drag_x = event.x;
			document.body.style.cursor = "col-resize";
			drag_idx = idx;
			cont_exercises.onmousemove = (event1) => {
				resizeInterval((event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
				drag_x = event1.x;
			}
		}
		cont_exercises.appendChild(elem_interval);
		gotoInterval(cur_interval);
	}
	btn_add_exercise.onclick = () => {
		addInterval("Exercise");
	}
	btn_add_rest.onclick = () => {
		addInterval("Rest");
	}
	btn_add_intro.onclick = () => {
		addInterval("Intro");
	}
	btn_add_outro.onclick = () => {
		addInterval("Outro");
	}
	opt_exercises.onchange = () => {
		if (opt_exercises == "" || cur_interval < 0 || intervals[cur_interval].type != "exercise") {
			return;
		}
		intervals[cur_interval].name = opt_exercises.value;
		getIntervalElement(cur_interval).children[1].innerText = opt_exercises.value;
		gotoInterval(cur_interval);
	}
	btn_save_all.onclick = () => {
		let temp = {
			"overrun": false,
			"lastPerformedTimeInterval": 0,
			"intervals": [],
			"numberOfSets": 9,
			"_type": "cust",
			"soundScheme": 1,
			"music":{
					"_type": "music",
					"shuffle": false,
					"volume": 1,
					"resume": true,
					"persist": false
			},
			"type": 0,
			"identifier": "192D054A-B056-45FB-ADC4-10CE40E2F117",
			"name": "Cool Down 1",
			"activity": 0
		}
		for (let it of intervals) {
			let temp1 = {
				"splitRest": 0,
				"ducked": false,
				"rest": false,
				"music":{ 
					"_type":"music",
					"shuffle":false,
					"volume":1,
					"resume":false,
					"persist":false
				},
				"color":0,
				"indefinite":false,
				"split":false,
				"vibration":true,
				"halfwayAlert":false,
				"duration":it.duration,
				"_type":"int",
				"name": it.id ? it.id + " - " + it.name : it.name
			};
			temp.intervals.push(temp1);
		}
		btn_save_all.setAttribute("href", "data:" + "application/json" + "," + encodeURIComponent(JSON.stringify(temp, null, "   ")))
		btn_save_all.setAttribute("download", "1.seconds");
	}
});