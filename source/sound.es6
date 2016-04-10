export default function startSound(sound, outside) {
    var loop = 'loop' in sound ? sound.loop : true;
    var shuffle = 'shuffle' in sound ? sound.shuffle : true;
    var overlap = sound.overlap || 0;
    var shuffleArray = outside.shuffle || function(x) { return x; };
    
    var tracks = sound.tracks.slice();
    if ( sound.tracks.length === 0 ) {
        throw new Error('Cannot start sound without tracks.');
    } 
    if ( shuffle ) {
        tracks = shuffleArray(tracks);
    }
    
    if ( outside.start.sound ) {
        var soundHandle = outside.start.sound();
    }
    var updateLatest = startTrack(0);
    
    return {
        stop: nothing
    };
    
    function updateSound() {
        updateLatest();
    }
    
    function startTrack(index) {
        var startTime = outside.time();
        var handle = outside.start.track(tracks[index], updateSound);
        var updateNext = null;
        
        return function update() {
            var currentTime = outside.time();
            var elapsed = currentTime - startTime;
            
            const duration = handle.duration();
            // Duration not known yet, so don't attempt any overlap until it is.
            if (isNaN(duration)) {
                return;
            }
            
            if ( elapsed >= duration ) {
                handle.stop();
            }
            
            if ( elapsed >= duration - overlap && !updateNext ) {
                if ( (index + 1) in tracks ) {
                    updateNext = startTrack(index + 1);
                }
                else if ( loop ) {
                    if ( shuffle ) {
                        tracks = shuffleArray(tracks);
                    }
                    updateNext = startTrack(0);
                }
                else {
                    // This must be here because if neither clause above is 
                    // entered, we will have the same update function and will 
                    // stop the track too many times if the update function is
                    // called more than once.
                    updateNext = nothing;
                    if ( soundHandle ) {
                        soundHandle();
                    }
                }
            }
            
            if ( elapsed >= duration && updateNext ) {
                updateLatest = updateNext;
            }
        };
    }
    
    function nothing() {}
};
