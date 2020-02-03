<template>
    <div>
        <table width="100%">
            <tr>
                <td valign="top">
                    <table class="table table-striped" style="margin-top:20px">
                        <thead class="thead-dark">
                            <th>title</th>
                            <th>field_portals</th>
                        </thead>
                        <tbody>
                            <tr v-for="(row) in $store.state.kp4cd.newsFeed">
                                <td>{{ row.title }}</td>
                                <td>{{ row.field_portals }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
        <table width="100%">
            <tr>
                <td valign="top">
                    <table class="table table-striped" style="margin-top:20px">
                        <thead class="thead-dark">
                            <th>body</th>
                        </thead>
                        <tbody>
                            <tr v-for="(row) in $store.state.kp4cd.frontContents">
                                <td v-html="row.body">{{ row.body }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
        <div>
            {{ $store.state.kp4cd.datasetsInfo }}
        </div>
    </div>
</template>
