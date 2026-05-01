<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body" v-if="!!$parent.pageContent">
            <h2 class="static-header">{{ $parent.pageContent.title }}</h2>
            <div v-if="!$parent.showData" v-html="$parent.pageContent.body"  class="static-content"></div>
            <div v-else-if="$parent.keyParamsPage === 'team'" class="static-content">
                <div v-if="$parent.teamSections.length > 0">
                    <div v-for="section in $parent.teamSections" class="team-section">
                        <h3>{{ section }}</h3>
                        <template v-for="member in $parent.dataPoints.filter(d => d.Membership === section)">
                            <div class="sysbio-team-member">
                                <div class="member-photo"><img :src="member.Photo" /></div>
                                <div class="member-name">{{ member.Name }}</div>
                                <div class="member-affiliation">{{ member.Affiliation }}</div>
                            </div>
                        </template>
                    </div>
                </div>
                <div v-else>
                    <template v-for="(member,mIndex) in $parent.dataPoints">
                        <div class="sysbio-team-member">
                            <div class="member-photo"><img :src="member.Photo" /></div>
                            <div class="member-name">{{ member.Name }}</div>
                            <div class="member-affiliation">{{ member.Affiliation }}</div>
                        </div>
                    </template>
                </div>
            </div>
            <div v-else>
                <div v-html="$parent.pageContent.body" class="static-content"></div>
                <b-table
                    small
                    :items="$parent.dataPoints">
                </b-table>
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
    width: 20%;
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
.team-section {
    margin-bottom: 50px;
}

</style>