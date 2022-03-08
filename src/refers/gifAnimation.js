var camera, scene, renderer, mesh, material, stats;
init();/*from   w ww  .d  emo 2 s . c  om*/
animate();
function init() {
    // Renderer.
    renderer = new THREE.WebGLRenderer();
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Add renderer to page
    document.body.appendChild(renderer.domElement);
    // Create camera.
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 400;
    // Create scene.
    scene = new THREE.Scene();
    // load the GIF texture
      var textureLoader = new THREE.TextureLoader().load(
'https://66.media.tumblr.com/d26724127f88993ccc45c70294ec2ece/tumblr_oofhopNoKn1s3rn2wo7_250.gif'
    );
    // Create material
    material = new THREE.MeshBasicMaterial( {
         map: textureLoader
    });
    // Create cube and add to scene.
    var geometry = new THREE.BoxGeometry(200, 200, 200);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    // Create ambient light and add to scene.
    var light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);
    // Create directional light and add to scene.
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    // Add listener for window resize.
    window.addEventListener('resize', onWindowResize, false);
    // Add stats to page.
    stats = new Stats();
    document.body.appendChild( stats.dom );
}
function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;
    // update the GIF texture
    mesh.material.map.needsUpdate = true;
    renderer.render(scene, camera);
    stats.update();
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}