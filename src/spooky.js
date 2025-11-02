// spooky.js - adds some mischief for the spOooOOoooky season!

let jumpscareImage = new Image();
jumpscareImage.src = "./PhantomBBJumpscare.gif";
document.querySelectorAll(`[data-js-on-click="true"]`).forEach(el => {
	el.addEventListener("click", _ => {
		let jumpscare = document.getElementById("jumpscare");
		jumpscare.src = jumpscareImage.src;
		jumpscare.style.display = "block";
		
		let scream = document.getElementById("scream");
		scream.play();
		document.body.classList.add("cursor-prohibit");
		
		scream.onended = _ => {
			document.body.classList.remove("cursor-prohibit");
			jumpscare.onclick = _ => {
				jumpscare.style.display = "none";
				jumpscare.onclick = null;
			};
		};
	});
});
