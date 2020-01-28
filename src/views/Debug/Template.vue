<template>
    <div>
        <table width="100%">
            <tr>
                <td valign="top">
                    <table class="table table-striped" style="margin-top:20px">
                        <thead class="thead-dark">
                            <th>region_name</th>
                        </thead>
                        <tbody>
                            <tr v-for="(row) in $parent.geneAnnotationByRegion">
                                <td>{{ row.region_name }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</template>
