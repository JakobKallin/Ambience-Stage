export default function() {
    let time = 0;
    const updates = [];
    
    return {
        time: () => time,
        track: callback => updates.push(callback),
        advance: amount => {
            time += amount;
            updates.forEach(update => update());
        }
    };
};
