export const convertWeekday = (dayNum) => {
    //월요일 0 일요일 6
    const weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
    return weekdays[dayNum];

}

export const settingInfoDTO = (data) => {
     return {
         "open_weekday" : convertWeekday(data.open_weekday),
         "open_time" : data.open_time,
         "max_use_time" : data.max_use_time
     };
}