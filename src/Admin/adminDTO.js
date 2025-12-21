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