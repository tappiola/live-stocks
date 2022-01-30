<script>
    import Line from "svelte-chartjs/src/Line.svelte"
    import 'chartjs-adapter-date-fns';
    import {format, zonedTimeToUtc} from 'date-fns-tz';
    import {getCssVariable} from "./helpers";
    import {CLOSE, TIME_SERIES_DATE_FORMAT, TIMEZONE, VOLUME} from "./constants";
    export let apiData = {};
    export let metadata = {};
    export let dayChange = 0;

    const getFieldData = (data, field) => Object.entries(data).reduce(
        (prev, [time, stats]) => {
            const utcDate = zonedTimeToUtc(time, TIMEZONE);
            const localDate = format(utcDate, TIME_SERIES_DATE_FORMAT);

            return {[localDate]: +stats[field], ...prev}
        }, {});

    $: priceData = getFieldData(apiData, CLOSE);

    $: volumeData = getFieldData(apiData, VOLUME);

    const average = list => list.reduce((prev, curr) => prev + curr, 0) / list.length;

    $: avgVolume = average(Object.values(volumeData));

    $: maxVolume = Math.max(...Object.values(volumeData));

    const getColorVariable = (dayChange) => {
        if(dayChange > 0){
            return '--growth';
        }

        if (dayChange < 0){
            return '--decline';
        }

        return '--primary-closer';
    }

    $: datasets = [
        {
        type: "line",
        label: 'Price',
        yAxisID: 'price',
        backgroundColor: getCssVariable(getColorVariable(dayChange)),
        borderColor: getCssVariable(getColorVariable(dayChange)),
        data: priceData,
    },
        {
            type: "bar",
            label: 'Volume',
            yAxisID: 'volume',
            backgroundColor: '#5a5a5a',
            borderColor: '#5a5a5a',
            data: volumeData,
        }
        ]

    $: options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm'
                    },
                    stepSize: 30,
                    parser: TIME_SERIES_DATE_FORMAT,
                },
                grid: {
                    color: '#3b3b3b',
                    drawBorder: false,
                },
            },
            volume: {
                position: 'right',
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    display: false
                },
                max: Math.max(avgVolume * 20, maxVolume * 2) || 300000,
            },
            price: {
                position: 'left',
                grid: {
                    borderColor: '#3b3b3b',
                    color: '#3b3b3b',
                },
            }
        },
        elements: {
            point: {
                radius: 0
            }
        }
    }

</script>

<Line data={ {datasets}} options={options}/>
