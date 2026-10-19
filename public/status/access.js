// Affiche « Code incorrect » quand le Worker renvoie sur /access?e=1
if (new URLSearchParams(location.search).has('e')) document.getElementById('err').hidden = false
