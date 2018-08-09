document.getElementById('open-room').onclick = function() {
    disableInputButtons();
    connection.open(document.getElementById('room-id').value, function() {
        showRoomURL(connection.sessionid);
    });
};
document.getElementById('join-room').onclick = function() {
    disableInputButtons();
    connection.join(document.getElementById('room-id').value);
};
document.getElementById('open-or-join-room').onclick = function() {
    disableInputButtons();
    connection.openOrJoin(document.getElementById('room-id').value, function(isRoomExist, roomid) {
        if (isRoomExist === false && connection.isInitiator === true) {
            // if room doesn't exist, it means that current user will create the room
            showRoomURL(roomid);
        }
    });
};
// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................
var connection = new RTCMultiConnection();
// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = "http://localhost:9001/";
// comment-out below line if you do not have your own socket.io server
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
connection.socketMessageEvent = 'video-conference-demo';
connection.session = {
    audio: true,
    video: true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

connection.maxParticipantsAllowed = 1; // one-to-one
connection.onRoomFull = function(roomid) {
  alert('Room is full.');
};


connection.videosContainer = document.getElementById('videos-container');
// set this line to close room as soon as owner leaves
connection.autoCloseEntireSession = true;
connection.onstream = function(event) {
    var existing = document.getElementById(event.streamid);
    if(existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
    //event.mediaElement.muted = true;
    //event.mediaElement.volume = 0;
    var video = document.createElement('video');
    try {
        video.setAttributeNode(document.createAttribute('autoplay'));
        video.setAttributeNode(document.createAttribute('playsinline'));
    } catch (e) {
        video.setAttribute('autoplay', true);
        video.setAttribute('playsinline', true);
    }
    if(event.type === 'local') {
      video.volume = 0;
      try {
          video.setAttributeNode(document.createAttribute('muted'));
      } catch (e) {
          video.setAttribute('muted', true);
      }
    }
    video.srcObject = event.stream;
    var width = parseInt(connection.videosContainer.clientWidth / 3) - 20;
    var mediaElement = getHTMLMediaElement(video, {
        title: event.userid,
        buttons: ['full-screen'],
        width: width,
        showOnMouseEnter: false
    });
    connection.videosContainer.appendChild(mediaElement);
    setTimeout(function() {
        mediaElement.media.play();
    }, 5000);
    mediaElement.id = event.streamid;
};
connection.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);
    }
};
connection.onMediaError = function(e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. Check github issue number 483.');
            return;
        }
        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connection.mediaConstraints.audio = {
            deviceId: secondaryMic
        };
        connection.join(connection.sessionid);
    }
};


/////////////////////////////////////////////
function disableInputButtons() {
    //document.getElementById('room-id').onkeyup();
    document.getElementById('open-or-join-room').disabled = true;
    document.getElementById('open-room').disabled = true;
    document.getElementById('join-room').disabled = true;
    document.getElementById('room-id').disabled = true;
}


function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = '?roomid=' + roomid;
    var html = '<h2>Unique URL for your room:</h2><br>';
    html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;
    roomURLsDiv.style.display = 'block';
}
(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;
    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;
})();
var roomid = '';
if (localStorage.getItem(connection.socketMessageEvent)) {
    roomid = localStorage.getItem(connection.socketMessageEvent);
} else {
    roomid = connection.token();
}
document.getElementById('room-id').value = roomid;
// document.getElementById('room-id').onkeyup = function() {
//     localStorage.setItem(connection.socketMessageEvent, document.getElementById('room-id').value);
// };
var hashString = location.hash.replace('#', '');
if (hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
}
var roomid = params.roomid;
if (!roomid && hashString.length) {
    roomid = hashString;
}
if (roomid && roomid.length) {
    document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);
    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function(isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
                return;
            }
            setTimeout(reCheckRoomPresence, 5000);
        });
    })();
    disableInputButtons();
}
// detect 2G
if(navigator.connection &&
   navigator.connection.type === 'cellular' &&
   navigator.connection.downlinkMax <= 0.115) {
  alert('2G is not supported. Please use a better internet service.');
}

// function openStream(){
//     const config = {
//         audio: true,
//         video: true
//     };
//     return navigator.mediaDevices.getUserMedia(config);
// }
// function playStream(idVideoTag, stream){
//     const video = document.getElementById(idVideoTag);
//     video.srcObject = stream;
//     video.play();
// }

// const peer = new Peer({ host: '192.168.100.22', port: 9000, debug: 3});

// peer.on('open', id => $('#my-peer').append(id));




// $('#btnCall').click(() =>{
//     $('#localStream').show();
//     $('#remoteStream').show();
//     const id = document.getElementById("contacts").value;
//     openStream()
//     .then(stream => {
//         playStream('localStream', stream);
//         const call = peer.call(id, stream);
//         $('#btnDone').show();
//         $('#btnDone').click(() =>{
//             call.close();
//             $('#localStream').hide();
//             $('#btnDone').hide();
//             $('#remoteStream').hide();
//         });
//         call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
//     });
// });

// peer.on('call', call => {
//     $('#localStream').show();
//     $('#remoteStream').show();
//     openStream()
//     .then(stream => {
//         call.answer(stream);
//         $('#btnDone').show();
//         $('#btnDone').click(() =>{
//             call.close();
//             $('#localStream').hide();
//             $('#remoteStream').hide();
//             $('#btnDone').hide();
//         });
//         playStream('localStream', stream);
//         call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
//     });
// });



