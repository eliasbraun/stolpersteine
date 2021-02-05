// Not to clean, works anyway
document.getElementById("open_camera").addEventListener("click", () => {
  document.querySelector("input[type='file']").click();
})

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object

  // files is a FileList of File objects. List some properties.
  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    output.push(escape(f.name));
  }
  console.log(output.join(''));
  document.querySelector(".fa-camera").className = "far fa-check-circle";
  document.getElementById("open_camera").style.background = "#000";
}

document.getElementById('stolperstein_input').addEventListener('change', handleFileSelect, false);