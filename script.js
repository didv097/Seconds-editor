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

let audio;
let workouts = []; // id, name, mp3, live_data
let intervals = [];	// type, name, duration, start, end
let exercises = []; // name, id
let selectedWorkout = -1;
let dur_audio = 0, cur_time = 0;
let cur_interval = 0, cur_exercise = 0;
let cur_start_time = 0, cur_duration = 0, cur_end_time = 0;
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
			console.log(j + " -> " + (j - 1))
		}
	}
	intervals.splice(idx, 1);
	cont_exercises.removeChild(document.getElementById("exercise-" + idx));
}
function gotoInterval(idx) {
	cur_interval = idx;
	cur_time = intervals[cur_interval].start_time;
	audio.currentTime = cur_time;
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
				intervals = JSON.parse(xHttp.responseText).intervals;
				console.log(intervals)
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
					let elem_interval = document.createElement("div");
					elem_interval.classList = ["exercise"];
					// elem_interval.classList.add("intro");
					elem_interval.style.width = (intervals[i].duration / dur_audio * 100) + "%";
					elem_interval.id = "exercise-" + i;
					let elem_icon = document.createElement("span");
					elem_icon.className = "exer-icon";
					elem_icon.innerHTML = "&#x1f5d1;";
					elem_icon.addEventListener("click", (event) => {
						let idx = Number(event.target.parentElement.id.slice(9));
						removeInterval(idx);
					})
					let elem_name = document.createElement("span");
					elem_name.className = "exer-name";
					elem_name.innerHTML = intervals[i].name;
					elem_name.addEventListener("click", (event) => {
						let idx = Number(event.target.parentElement.id.slice(9));
						gotoInterval(idx);
					})
					elem_interval.appendChild(elem_icon);
					elem_interval.appendChild(elem_name);
					cont_exercises.appendChild(elem_interval);
				}
			}
		})
		xHttp.send(null);
	});
	audio.addEventListener("timeupdate", () => {
		cur_time = audio.currentTime;
		elem_cur_time.innerText = ("00" + parseInt(cur_time / 60).toString()).slice(-2)
			+ ":" + ("00" + parseInt(cur_time % 60).toString()).slice(-2);
		progressbar.style.width = (100 * cur_time / dur_audio) + "%";
		cur_interval = -1;
		for (let i = 0; i < intervals.length; i ++) {
			if (cur_time < intervals[i].end_time) {
				cur_interval = i;
				break;
			}
		}
		if (cur_interval < 0) {
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
	});
}
btn_process.addEventListener("click", () => btnProcessClicked());
btn_play.addEventListener("click", () => {
	audio.play();
	input_start_time.readOnly = true;
	// input_duration.readOnly = true;
	input_end_time.readOnly = true;
});
btn_pause.addEventListener("click", () => {
	audio.pause();
	input_start_time.readOnly = false;
	// input_duration.readOnly = false;
	input_end_time.readOnly = false;
});
btn_back10.addEventListener("click", () => {
	cur_time -= 10;
	cur_time = Math.max(cur_time, 0);
	audio.currentTime = cur_time;
});
btn_forward10.addEventListener("click", () => {
	cur_time += 10;
	cur_time = Math.min(cur_time, dur_audio);
	audio.currentTime = cur_time;
});
btn_match.addEventListener("click", () => {
	cur_exercise = -1;
	for (let i = 0; i < exercises.length; i ++) {
		if (exercises[i].name == intervals[cur_interval].name) {
			cur_exercise = i;
			break;
		}
	}
	if (cur_exercise < 0) {
		exercises.push({
			name: intervals[cur_interval].name,
			id: intervals[cur_interval].name
		});
		let opt = document.createElement("option");
		opt.text = intervals[cur_interval].name;
		opt_exercises.add(opt);
		cur_exercise = exercises.length - 1;
		opt_exercises.value = intervals[cur_interval].name;
	} else {
		opt_exercises.value = exercises[cur_exercise].name;
	}
});
btn_previous.addEventListener("click", () => {
	if (selectedIndex > 0) {
		opt_workout.selectedIndex --;
		btnProcessClicked();
	}
});
btn_next.addEventListener("click", () => {
	if (selectedIndex < workouts.length - 1) {
		opt_workout.selectedIndex ++;
		btnProcessClicked();
	}
});
input_start_time.addEventListener("input", () => {
	input_duration.value = input_end_time.value - input_start_time.value;
});
input_end_time.addEventListener("input", () => {
	input_duration.value = input_end_time.value - input_start_time.value;
});
input_start_time.addEventListener("change", () => {
	if (cur_interval <= 0) {
		input_start_time.value = 0;
		input_duration.value = cur_end_time;
		return;
	}
	if (input_start_time.value >= cur_end_time || input_start_time.value <= intervals[cur_interval - 1].start_time) {
		input_start_time.value = cur_start_time;
	}
	cur_start_time = input_start_time.value;
	cur_duration = cur_end_time - cur_start_time;
	input_duration.value = cur_duration;
});
input_end_time.addEventListener("change", () => {
	if (cur_interval >= intervals.length - 1) {
		input_end_time.value = cur_end_time;
		return;
	}
	if (input_end_time.value <= cur_start_time || input_end_time.value >= intervals[cur_interval + 1].end_time) {
		input_end_time.value = cur_end_time;
	}
	cur_end_time = input_end_time.value;
	cur_duration = cur_end_time - cur_start_time;
	input_duration.value = cur_duration;
});
btn_save.addEventListener("click", () => {
	if (cur_interval > 0) {
		intervals[cur_interval].start_time = input_start_time.value;
		intervals[cur_interval - 1].end_time = input_start_time.value;
	}
	intervals[cur_interval].end_time = input_end_time.value;
	if (cur_interval < intervals.length - 1) {
		intervals[cur_interval + 1].start_time = input_end_time.value;
	}
});
btn_add_exercise.addEventListener("click", () => {
  let new_idx = intervals.length;
  let remaning_time = dur_audio - intervals[new_idx - 1].end_time;
  if (remaning_time <= 0) {
    return;
  }
  let new_interval = {
    name: "Exercise",
    start_time: intervals[new_idx - 1].end_time,
    duration: Math.min(remaning_time, 10)
  };
  new_interval.end_time = new_interval.start_time + new_interval.duration;
  intervals.push(new_interval);
  let elem_interval = document.createElement("div");
  elem_interval.classList = ["exercise"];
	elem_interval.style.width = (new_interval.duration / dur_audio * 100) + "%";
	elem_interval.id = "exercise-" + new_idx;
  let elem_icon = document.createElement("span");
  elem_icon.className = "exer-icon";
  elem_icon.innerHTML = "&#x1f5d1;";
  elem_icon.addEventListener("click", () => {
		let idx = Number(event.target.parentElement.id.slice(9));
		removeInterval(idx);
  })
  let elem_name = document.createElement("span");
  elem_name.className = "exer-name";
  elem_name.innerHTML = new_interval.name;
  elem_name.addEventListener("click", () => {
		let idx = Number(event.target.parentElement.id.slice(9));
		gotoInterval(idx);
  })
  elem_interval.appendChild(elem_icon);
  elem_interval.appendChild(elem_name);
  cont_exercises.appendChild(elem_interval);
})