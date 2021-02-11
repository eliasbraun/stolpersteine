// Not to clean, works anyway
document.getElementById("open_camera").addEventListener("click", () => {
  document.querySelector("input[type='file']").click();
})

function handleFileSelect(evt) {
  const camera_wrapper  = document.querySelector("#open_camera");
  const camera_icon     = document.querySelector(".fa-camera");
  const upload_button   = document.querySelector("#upload_btn");
  var files             = evt.target.files; // FileList object

  // files is a FileList of File objects. List some properties.
  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    output.push(escape(f.name));
  }
  camera_icon.className = "far fa-check-circle"; // checkmark instead of camera
  camera_wrapper.setAttribute('style', 'box-shadow: none !important; background: #323232;');
  upload_button.setAttribute('style', 'display: block;');
}

document.getElementById('stolperstein_input').addEventListener('change', handleFileSelect, false);