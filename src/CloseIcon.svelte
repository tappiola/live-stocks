<script>
    export let onCloseClick;
    export let isChart = false;
    export let isInput = false;
</script>

<svg
        class="close-icon"
        class:isChart={isChart}
        class:isInput={isInput}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        on:click={onCloseClick}
>
    <path d="M16.192 6.34399L11.949 10.586L7.707 6.34399L6.293 7.75799L10.535 12L6.293 16.242L7.707 17.656L11.949 13.414L16.192 17.656L17.606 16.242L13.364 12L17.606 7.75799L16.192 6.34399Z" />
</svg>

<style>
    .close-icon {
        fill: gray;
        cursor: pointer;
    }

    .isInput {
        position: absolute;
        right: 10px;
    }

    .isChart {
        width: 40px;
        height: 40px;
        fill: var(--secondary-lightest);
    }

    .isChart:hover {
        color: pink;
    }

    .close-icon:hover {
        fill: var(--primary-text);
    }
</style>