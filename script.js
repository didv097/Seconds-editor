let btn_builder = document.getElementById("btn-builder");
let btn_process = document.getElementById("btn-process");
let input_csv = document.getElementById("csv-upload");
let opt_workout = document.getElementById("opt-workout");
let progressbar = document.getElementById("progress-bar");
let elem_cur_time = document.getElementById("cur-playback");
let cont_exercises = document.getElementById("cont-exercises");
let cont_file_upload = document.getElementById("cont-file-upload");
let cont_browser = document.getElementById("cont-browser");
let elem_workout_id = document.getElementById("workout-id");
let elem_workout_name = document.getElementById("workout-name");
let btn_back10 = document.getElementById("btn-back10s");
let btn_play = document.getElementById("btn-play");
let btn_forward10 = document.getElementById("btn-forward10s");
let btn_pause = document.getElementById("btn-pause");
let opt_exercises = document.getElementById("opt-exercises");
let btn_match = document.getElementById("btn-match");
let input_start_time = document.getElementById("input-start-time");
let input_duration = document.getElementById("input-duration");
let input_end_time = document.getElementById("input-end-time");
let text_exercise = document.getElementById("text-exercise");
let btn_previous = document.getElementById("btn-previous");
let btn_next = document.getElementById("btn-next");
let btn_save = document.getElementById("btn-save");
let btn_save_all = document.getElementById("btn-save-all");
let btn_add_exercise = document.getElementById("btn-add-exercise");
let btn_add_rest = document.getElementById("btn-add-rest");
let btn_add_intro = document.getElementById("btn-add-intro");
let btn_add_outro = document.getElementById("btn-add-outro");

let selectedIndex;
let audio;
let workouts = []; // id, name, mp3, live_data
let intervals = [];	// type, name, duration, start, end
let exercises = []; // name, id
let selectedWorkout = -1;
let dur_audio = 0, cur_time = 0;
let cur_interval = -1, cur_exercise = -1;
let cur_start_time = 0, cur_duration = 0, cur_end_time = 0;
let csv_content = {};
let drag_x = 0;

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
function removeInterval(idx) {
	if (idx < intervals.length - 1) {
		for (let j = idx + 1; j < intervals.length; j ++) {
			intervals[j].start_time -= intervals[idx].duration;
			intervals[j].end_time -= intervals[idx].duration;
			document.getElementById("exercise-" + j).id = "exercise-" + (j - 1);
		}
	}
	intervals.splice(idx, 1);
	cont_exercises.removeChild(document.getElementById("exercise-" + idx));
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
		document.getElementById("exercise-" + (cur_interval - 1)).style.width = (intervals[cur_interval - 1].duration / dur_audio * 100) + "%";
	}
	intervals[cur_interval].end_time = cur_end_time;
	intervals[cur_interval].duration = cur_end_time - intervals[cur_interval].start_time;
	document.getElementById("exercise-" + cur_interval).style.width = (intervals[cur_interval].duration / dur_audio * 100) + "%";
	if (cur_interval < intervals.length - 1) {
		intervals[cur_interval + 1].start_time = cur_end_time;
		intervals[cur_interval + 1].duration =intervals[cur_interval + 1].end_time - cur_end_time;
		document.getElementById("exercise-" + (cur_interval + 1)).style.width = (intervals[cur_interval + 1].duration / dur_audio * 100) + "%";
	}
}

function resizeInterval(idx, offT) {
	intervals[idx].duration += offT;
	intervals[idx].end_time += offT;
	if (idx < intervals.length - 1) {
		intervals[idx + 1].duration -= offT;
		intervals[idx + 1].start_time += offT;
		cont_exercises.children[idx + 1].style.width = intervals[idx + 1].duration / dur_audio * 100 + "%";
	}
	cont_exercises.children[idx].style.width = intervals[idx].duration / dur_audio * 100 + "%";
}

function btnProcessClicked() {
	selectedIndex = opt_workout.selectedIndex;
	if (selectedIndex < 0) {
		return;
	}
	cont_file_upload.style.display = "none";
	cont_browser.style.display = "block";

	elem_workout_id.innerText = workouts[selectedIndex].id;
	elem_workout_name.innerText = workouts[selectedIndex].name;



	audio = new Audio(workouts[selectedIndex].mp3);
	audio.addEventListener("loadeddata", () => {
		dur_audio = parseInt(audio.duration);
		document.getElementById("audio-duration").innerText = ("00" + parseInt(dur_audio / 60).toString()).slice(-2)
			+ ":" + ("00" + parseInt(dur_audio % 60).toString()).slice(-2);
		audio.play()
		cur_time = 0;
		progressbar.style.width = "0%";

		intervals = [];
		let xHttp = new XMLHttpRequest();
		xHttp.open("GET", workouts[selectedIndex].live_data, true);
		xHttp.addEventListener("load", () => {
			if (xHttp.readyState == 4 && xHttp.status == 200) {
				csv_content = JSON.parse(xHttp.responseText);
				intervals = csv_content.intervals;
				cont_exercises.innerHTML = "";
				let temp = 0;
				for (let i = 0; i < intervals.length; i ++) {
					intervals[i].start_time = temp;
					temp += intervals[i].duration;
					if (temp > dur_audio) {
						intervals.length = i;
						break;
					}
					intervals[i].end_time = temp;
					let type_name = intervals[i].name.split(" - ");
					intervals[i].type = type_name[0].toLowerCase();
					intervals[i].name = type_name[1];
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
						if (!(idx >= 0 && idx <intervals.length)) {
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
						cont_exercises.onmousemove = (event1) => {
							resizeInterval(idx, (event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
							drag_x = event1.x;
						}
					}
					cont_exercises.appendChild(elem_interval);
					cont_exercises.onmouseup = () => {
						cont_exercises.onmousemove = () => {};
					}
				}
			}
		})
		xHttp.send(null);
	});
	audio.ontimeupdate = () => {
		cur_time = audio.currentTime;
		elem_cur_time.innerText = ("00" + parseInt(cur_time / 60).toString()).slice(-2)
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
		}
		btn_match.className = "btn btn-danger";
		btn_match.innerText = "Not match";
		opt_exercises.value = "";
		for (ex of exercises) {
			if (cur_interval >= 0 && intervals[cur_interval].name.toLowerCase() == ex.name.toLowerCase()) {
				btn_match.className = "btn btn-success";
				btn_match.innerText = "Match";
				opt_exercises.value = ex.name;
				break;
			}
		}
	};
	opt_exercises.onchange = () => {
		if (opt_exercises == "" || cur_interval < 0) {
			return;
		}
		intervals[cur_interval].name = opt_exercises.value;
		document.getElementById("exercise-" + cur_interval).children[1].innerText = opt_exercises.value;
	}
	function addExercise(type) {
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
			if (event.offsetX < 5) {
				if (idx == 0) {
					return;
				}
				idx --;
			} else if (event.target.offsetWidth - event.offsetX >= 5) {
				return;
			}
			drag_x = event.x;
			cont_exercises.onmousemove = (event1) => {
				resizeInterval(idx, (event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
				drag_x = event1.x;
			}
		}
		cont_exercises.appendChild(elem_interval);
	}
	btn_add_exercise.onclick = () => {
		addExercise("Exercise");
	};
	btn_add_rest.onclick = () => {
		addExercise("Rest");
	};
	btn_add_intro.onclick = () => {
		addExercise("Intro");
	};
	btn_add_outro.onclick = () => {
		addExercise("Outro");
	};
	btn_save.onclick = btn_save_all.onclick = () => {
		let temp = {
			"overrun": csv_content.overrun,
			"lastPerformedTimeInterval": csv_content.lastPerformedTimeInterval,
			"intervals": [],
			"numberOfSets": csv_content.numberOfSets,
			"_type": csv_content._type,
			"soundScheme": csv_content.soundScheme,
			"music":{
					"_type": csv_content.music._type,
					"shuffle": csv_content.music.shuffle,
					"volume": csv_content.music.volume,
					"resume": csv_content.music.resume,
					"persist": csv_content.music.persist
			},
			"type": csv_content.type,
			"identifier": csv_content.identifier,
			"name": csv_content.name,
			"activity": csv_content.activity
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
				"name": it.type + " - " + it.name
			};
			temp.intervals.push(temp1);
		}
		// let xHttp = new XMLHttpRequest();
		// xHttp.open("PUT", workouts[selectedIndex].live_data, true);
		// let blob = new Blob([JSON.stringify(temp, null, "   ")], {type: "application/json"});
		// xHttp.onload = () => {
		// 	console.log(xHttp.response)
		// }
		// xHttp.send(blob);
		let file = new File([JSON.stringify(temp, null, "   ")], "1.json", {type: "application/octet-stream"});
		let blobUrl = (URL || webkitURL).createObjectURL(file);
		window.location = blobUrl;
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
	if (cur_interval >= intervals.length - 1) {
		input_end_time.value = cur_end_time;
		return;
	}
	if (input_end_time.value <= cur_start_time || input_end_time.value >= intervals[cur_interval + 1].end_time) {
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
		btn_match.className = "btn btn-danger";
		btn_match.innerText = "Not match";
		opt_exercises.value = "";
		for (ex of exercises) {
			if (intervals[cur_interval].name.toLowerCase() == ex.name.toLowerCase()) {
				btn_match.className = "btn btn-success";
				btn_match.innerText = "Match";
				opt_exercises.value = ex.name;
				break;
			}
		}
	}
	function addExercise(type) {
		cur_interval = intervals.length;
		let new_interval = {
			name: type,
			type: type.toLowerCase(),
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
			if (event.offsetX < 5) {
				if (idx == 0) {
					return;
				}
				idx --;
			} else if (event.target.offsetWidth - event.offsetX >= 5) {
				return;
			}
			drag_x = event.x;
			cont_exercises.onmousemove = (event1) => {
				resizeInterval(idx, (event1.x - drag_x) / cont_exercises.offsetWidth * dur_audio);
				drag_x = event1.x;
			}
		}
		cont_exercises.appendChild(elem_interval);
		cont_exercises.onmouseup = () => {
			cont_exercises.onmousemove = () => {};
		}
		gotoInterval(cur_interval);
	}
	btn_add_exercise.onclick = () => {
		addExercise("Exercise");
	}
	btn_add_rest.onclick = () => {
		addExercise("Rest");
	}
	btn_add_intro.onclick = () => {
		addExercise("Intro");
	}
	btn_add_outro.onclick = () => {
		addExercise("Outro");
	}
	opt_exercises.onchange = () => {
		if (opt_exercises == "" || cur_interval < 0) {
			return;
		}
		intervals[cur_interval].name = opt_exercises.value;
		document.getElementById("exercise-" + cur_interval).children[1].innerText = opt_exercises.value;
		gotoInterval(cur_interval);
	}
	btn_save.onclick = btn_save_all.onclick = () => {
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
				"name": it.type + " - " + it.name
			};
			temp.intervals.push(temp1);
		}
		let file = new File([JSON.stringify(temp, null, "   ")], "1.json", {type: "application/octet-stream"});
		let blobUrl = (URL || webkitURL).createObjectURL(file);
		window.location = blobUrl;
	}
});