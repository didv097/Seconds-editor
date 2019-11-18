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

let audio;
let workouts = []; // id, name, mp3, live_data
let intervals = [];	// type, name, duration, start, end
let exercises = []; // name, id
let selectedWorkout = -1;
let dur_audio = 0, cur_time = 0;
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
xHttpCSV.send(null)
btn_process.onclick = event => {
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
					console.log(elem_interval.style.width)
					let elem_icon = document.createElement("span");
					elem_icon.className = "exer-icon";
					elem_icon.innerHTML = "&#x1f5d1;";
					let elem_name = document.createElement("span");
					elem_name.className = "exer-name";
					elem_name.innerHTML = intervals[i].name;
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
	});
	btn_play.addEventListener("click", () => {
		audio.play();
	});
	btn_pause.addEventListener("click", () => {
		audio.pause();
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
}