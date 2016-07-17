import start from './scene';

export default function stage(outside) {
    let abort = nothing;
    let stop = fade => nothing;
    
    return (items, fadeInDuration?) => {
        abort();
        abort = stop(fadeInDuration);
        stop = start(items, fadeInDuration, outside);
        return {
            volume: ratio => {
                stop['volume'](ratio);
            }
        };
    }
    
    function nothing() {}
}
