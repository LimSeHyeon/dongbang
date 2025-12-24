import moment from 'moment-timezone';

export const convertWeekday = (dayNum) => {
    //월요일 0 일요일 6
    const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    return weekdays[dayNum];

}

export const settingInfoDTO = (data) => {
     return {
         "openWeekday" : convertWeekday(data.open_weekday),
         "openTime" : data.open_time,
         "maxUseTime" : data.max_use_time
     };
}

export const historyDTO = (data, summary) => {
    return {
        summary : {
            totalDuration : Number(summary.totalDuration || 0),
            totalCount : summary.totalCount,
            period : `${moment(summary.startDate).format('YYYY-MM-DD')} ~ ${moment(summary.endDate).format('YYYY-MM-DD')}`
        },
        data: data.map(item => ({
        "historyId" : item.history_id,
        "songName" : item.song_name,
        "startTime" : moment(item.start_time).format('YYYY-MM-DD HH:mm:ss'),
        "requestTime" : moment(item.request_time).format('YYYY-MM-DD HH:mm:ss'),
        "hapjuTerm" : item.hapju_term
        }))
    }
};