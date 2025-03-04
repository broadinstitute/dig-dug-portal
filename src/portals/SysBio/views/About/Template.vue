<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body" v-if="!!$parent.pageContent">
            <h2 class="static-header">{{ $parent.pageContent.title }}</h2>
            <div v-if="$parent.keyParamsPage != 'team'" v-html="$parent.pageContent.body"  class="static-content"></div>
            <div v-else-if="$parent.keyParamsPage == 'team'" class="static-content">
                
                <template v-for="(member,mIndex) in $parent.csv2Json($parent.pageContent.field_data_points)">
                    <div class="sysbio-team-member">
                        <div class="member-photo"><img :src="member.Photo" /></div>
                        <div class="member-name">{{ member.Name }}</div>
                        <div class="member-affiliation">{{ member.Affiliation }}</div>
                        <div class="member-role"><span class="role">Role Internal</span>
                            <span>{{ member["Role Internal"] }}</span></div>
                        <div class="member-role"><span class="role">Role External</span>
                            <span>{{ member["Role External"] }}</span></div>
                    </div>
                </template>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
export default {

}
</script>

<style scoped>
.sysbio-body{
    max-width: 1000px !important;
}

.sysbio-team-member {
    display:inline-grid;
    width: 30%;
    padding: 2%;
}

.sysbio-team-member .member-photo {
    text-align: center;
}

.sysbio-team-member .member-photo img {
    width: 80%;
}

.sysbio-team-member .member-name {
    font-size: 1.3em;
    font-weight: 700;
    margin-top: 15px;
}

.sysbio-team-member .member-affiliation {
}

.sysbio-team-member .member-role span{
    display: block;
}

.sysbio-team-member .member-role span.role {
    font-size: 0.85em;
    font-weight: bold;
    margin-top: 15px;
}



</style>