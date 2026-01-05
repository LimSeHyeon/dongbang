/**
 * Checks if a requested time slot is fully occupied by existing reservations.
 * Allows partial overlaps, but prevents booking if the entire requested duration is taken.
 * 
 * @param {Array} reservations - List of reservation objects
 * @param {String} day - Day string (e.g., 'mon', 'tue')
 * @param {Number} reqStart - Requested start time (decimal hour, e.g., 14.5)
 * @param {Number} reqEnd - Requested end time (decimal hour)
 * @returns {Boolean} true if fully occupied, false otherwise
 */
function checkFullyOccupied(reservations, day, reqStart, reqEnd) {
    const dayRes = reservations.filter(r => r.day === day);
    const intervals = [];
    
    // 1. Get intersections
    dayRes.forEach(r => {
        const [rh, rm] = r.startTime.split(':').map(Number);
        const rStart = rh + (rm / 60);
        const rEnd = rStart + r.duration;
        
        const start = Math.max(reqStart, rStart);
        const end = Math.min(reqEnd, rEnd);
        
        if (start < end) {
            intervals.push({start, end});
        }
    });

    if (intervals.length === 0) return false;

    // 2. Merge overlapping intervals
    intervals.sort((a, b) => a.start - b.start);
    
    let merged = [];
    let curr = intervals[0];
    
    for (let i = 1; i < intervals.length; i++) {
        // Overlap or adjacent
        if (intervals[i].start <= curr.end + 0.001) { 
            curr.end = Math.max(curr.end, intervals[i].end);
        } else {
            merged.push(curr);
            curr = intervals[i];
        }
    }
    merged.push(curr);

    // 3. Sum duration
    const occupiedDuration = merged.reduce((acc, cur) => acc + (cur.end - cur.start), 0);
    const reqDuration = reqEnd - reqStart;

    return occupiedDuration >= (reqDuration - 0.001); // Float tolerance
}
