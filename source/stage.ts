import start from './scene';

export default function stage(outside) {
    let abort = nothing;
    let stop = {
        stop: fadeDuration => nothing,
        volume: newVolume => {}
    };
    
    return (items, fadeInDuration=0) => {
        abort();
        abort = stop.stop(fadeInDuration);
        stop = start(items, fadeInDuration, outside);
        return {
            volume: ratio => {
                stop.volume(ratio);
            }
        };
    }
    
    function nothing() {}
}
