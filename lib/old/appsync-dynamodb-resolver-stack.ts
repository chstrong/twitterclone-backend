import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import {
    GraphqlApi,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
//import VtlReplace from './shared/vtlreplace';

interface AppsyncDynamoDbResolverStackProps extends StackProps {
    appName: string,
    stage: string,
    api: GraphqlApi,
    userTable: Table,
    tweetTable: Table,
    timelineTable: Table,
}

export class AppsyncDynamoDbResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncDynamoDbResolverStackProps) {
        super(scope, id, props);

        // CREATE DATASOURCES
        const UserTableDs = props.api.addDynamoDbDataSource('UserTableDs', props.userTable);
        const TweetTableDs = props.api.addDynamoDbDataSource('TweetTableDs', props.tweetTable);
        const TimelineTableDs = props.api.addDynamoDbDataSource('TimelineTableDs', props.timelineTable);

        // GET MY PROFILE RESOLVER
        UserTableDs.createResolver('GetMyProfile', {
            typeName: 'Query',
            fieldName: 'getMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyProfile.response.vtl')
            ),
        });

        // EDIT MY PROFILE RESOLVER
        UserTableDs.createResolver('EditMyProfile', {
            typeName: 'Mutation',
            fieldName: 'editMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Mutation.editMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Mutation.editMyProfile.response.vtl')
            ),
        });

        // GET TWEETS RESOLVER
        TweetTableDs.createResolver('GetTweets', {
            typeName: 'Query',
            fieldName: 'getTweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getTweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getTweets.response.vtl')
            ),
        });

        // GET MY TIMELINE RESOLVER
        TimelineTableDs.createResolver('GetMyTimeline', {
            typeName: 'Query',
            fieldName: 'getMyTimeline',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyTimeline.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyTimeline.response.vtl')
            ),
        });

        // NESTED FIELD PROFILE RESOLVER
        UserTableDs.createResolver('NestedTweetProfile', {
            typeName: 'Tweet',
            fieldName: 'profile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Tweet.profile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Tweet.profile.response.vtl')
            ),
        });
/*
        // NESTED FIELD PROFILE RESOLVER
        const vtlfilepath:string = path.join(__dirname, 'graphql/mapping-templates/TimelinePage.tweets.request.vtl')
        const attrs = new Map<string,string>().set("{TWEETTABLE}", props.timelineTable.tableName);
        const mapTmpl = VtlReplace(vtlfilepath, attrs);

        TweetTableDs.createResolver('NestedTimelineProfile', {
            typeName: 'TimelinePage',
            fieldName: 'tweets',
            requestMappingTemplate: MappingTemplate.fromString(mapTmpl),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/TimelinePage.tweets.response.vtl')
            ),
        });
            */
    }
}