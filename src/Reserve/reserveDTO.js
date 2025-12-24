import moment from 'moment-timezone';

export const reserveListDTO = (data, startDate, endDate) => {
    return {
        period : `${moment(startDate).format('YYYY-MM-DD')} ~ ${moment(endDate).format('YYYY-MM-DD')}`,
        reservation : data.map(item => ({
            "reservationId" : item.reservation_id,
            "songName" : item.song_name,
            "startTime" : moment(item.start_time.toISOString().replace('T', ' ').replace('Z', '')).format('YYYY-MM-DD HH:mm:ss'),
            "endTime" : moment(item.end_time.toISOString().replace('T', ' ').replace('Z', '')).format('YYYY-MM-DD HH:mm:ss'),
            "reservedTime" : moment(item.reserved_time.toISOString().replace('T', ' ').replace('Z', '')).format('YYYY-MM-DD HH:mm:ss'),
            "byAdmin" : item.by_admin
        }))
    }
}