<template>
    <div>
        <markdown
            :content="'# hello, markdown! {{gene}} {{disease}}'"
            :content_fill='{
                gene: "slc308"
            }'
        ></markdown>
    </div>
</template>
